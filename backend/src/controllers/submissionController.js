import prisma, { withDbRetry } from '../config/prisma.js';
import { runCode } from './compilerController.js';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const startSubmission = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await prisma.exam.findUnique({ 
      where: { id: examId },
      select: {
        id: true,
        status: true,
        schedule: true,
        settings: true,
        questions: {
          select: {
            id: true,
            type: true,
            points: true,
            options: { select: { id: true, text: true } },
            matchingPairs: { select: { id: true, leftItem: true, rightItem: true } }
          }
        }
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const now = new Date();
    
    const rescheduleTicket = await prisma.missedExamTicket.findFirst({
      where: {
        examId: examId,
        studentId: req.user.id,
        isRescheduled: true,
        status: 'approved'
      },
      select: {
        rescheduledStartTime: true,
        rescheduledEndTime: true
      }
    });

    let hasRescheduledAccess = false;
    if (rescheduleTicket && rescheduleTicket.rescheduledStartTime && rescheduleTicket.rescheduledEndTime) {
       const resStartTime = new Date(rescheduleTicket.rescheduledStartTime);
       const resEndTime = new Date(rescheduleTicket.rescheduledEndTime);
       if (now >= resStartTime && now <= resEndTime) {
          hasRescheduledAccess = true;
       }
    }

    const isAutoStarted = exam.status === 'published' && exam.schedule?.startDate && new Date(exam.schedule.startDate) <= now;
    
    if (!hasRescheduledAccess) {
      if (exam.status !== 'active' && !isAutoStarted) return res.status(400).json({ success: false, message: 'Exam is not active yet.' });
    }
    
    if (isAutoStarted && exam.status !== 'active') {
      await prisma.exam.update({ where: { id: examId }, data: { status: 'active' } });
      try {
        const { getIO } = await import('../sockets/proctorSocket.js');
        getIO().emit('exam_status_changed', { examId: examId, status: 'active' });
      } catch (e) {
        console.error('Socket emission failed on auto-start:', e);
      }
    }

    let sub = await prisma.submission.findFirst({ where: { examId: examId, studentId: req.user.id } });
    if (sub && (sub.status === 'submitted' || sub.status === 'auto_submitted')) return res.status(400).json({ success: false, message: 'Exam already submitted' });
    if (sub && sub.status === 'force_submitted') return res.status(403).json({ success: false, message: 'You have been disqualified and locked out by the proctor.' });

    let resumed = false;
    if (sub) {
      resumed = true;
    } else {
      let pool = [...exam.questions];
      const isRandomized = exam.settings?.randomizeQuestions === true;

      if (isRandomized) {
         const isTypeDistEnabled = exam.settings?.enableTypeDistribution;
         const dist = exam.settings?.typeDistribution;

         if (isTypeDistEnabled && dist) {
             let finalPool = [];
             ['mcq', 'coding', 'matching', 'subjective'].forEach(t => {
                 const reqCount = parseInt(dist[t], 10) || 0;
                 if (reqCount > 0) {
                     let typedQs = pool.filter(q => q.type === t);
                     typedQs = shuffleArray(typedQs);
                     finalPool = finalPool.concat(typedQs.slice(0, reqCount));
                 }
             });
             pool = shuffleArray(finalPool); 
         } else {
             pool = shuffleArray(pool);
             const serveLimit = parseInt(exam.settings?.questionPoolSize, 10);
             if (!isNaN(serveLimit) && serveLimit > 0) pool = pool.slice(0, serveLimit); 
         }
      }

      const answers = pool.map(q => {
        let options = [];
        let matchingLeft = [];
        let matchingRight = [];

        if (q.type === 'mcq') {
           options = q.options.map(o => ({ id: o.id, text: o.text }));
           if (isRandomized) options = shuffleArray(options);
        } else if (q.type === 'matching' && q.matchingPairs) {
           matchingLeft = q.matchingPairs.map(mp => ({ id: mp.id, text: mp.leftItem }));
           matchingRight = q.matchingPairs.map(mp => ({ id: mp.id, text: mp.rightItem }));
           
           if (isRandomized) {
              matchingLeft = shuffleArray(matchingLeft);
              matchingRight = shuffleArray(matchingRight);
           }
        }

        return {
          questionId: q.id,
          questionType: q.type,
          selectedOptionId: null, 
          selectedOption: -1,     
          code: '',
          language: 'python',
          textAnswer: '',
          studentMatches: {},     
          maxScore: Number(q.points) || 10, 
          options: options,
          matchingLeft: matchingLeft,     
          matchingRight: matchingRight    
        };
      });

      const dynamicMaxScore = pool.reduce((acc, q) => acc + (Number(q.points) || 10), 0);

      sub = await prisma.submission.create({
        data: {
          examId: examId, studentId: req.user.id, answers: answers, 
          maxScore: dynamicMaxScore,
        }
      });
    }

    const durationMins = exam.schedule?.durationMinutes || 60;
    const subStartMs = sub ? new Date(sub.createdAt).getTime() : Date.now();
    let calculatedDeadlineMs = subStartMs + (durationMins * 60 * 1000);

    if (hasRescheduledAccess && rescheduleTicket?.rescheduledEndTime) {
      calculatedDeadlineMs = Math.min(calculatedDeadlineMs, new Date(rescheduleTicket.rescheduledEndTime).getTime());
    } else if (exam.schedule?.endDate) {
      calculatedDeadlineMs = Math.min(calculatedDeadlineMs, new Date(exam.schedule.endDate).getTime());
    }
    const expiresAt = new Date(calculatedDeadlineMs).toISOString();

    res.json({ 
      success: true, 
      resumed, 
      data: { 
        ...sub, 
        _id: sub.id, 
        expiresAt,
        rescheduledEndTime: hasRescheduledAccess ? rescheduleTicket.rescheduledEndTime : null 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveAnswers = async (req, res) => {
  try {
    await withDbRetry(async () => {
      const sub = await prisma.submission.findUnique({
        where: { id: req.params.id },
        select: { 
          id: true, 
          studentId: true, 
          status: true,
          createdAt: true,
          exam: { select: { schedule: true } }
        }
      });
      if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
      if (sub.studentId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
      
      if (['submitted', 'auto_submitted', 'force_submitted'].includes(sub.status)) {
        return res.status(400).json({ success: false, message: 'Cannot modify a submitted exam' });
      }

      // 120s grace period for network latency before strict deadline enforcement
      const durationMins = sub.exam?.schedule?.durationMinutes || 60;
      const deadlineMs = new Date(sub.createdAt).getTime() + (durationMins * 60 * 1000) + 120000;
      if (Date.now() > deadlineMs) {
        await prisma.submission.update({
          where: { id: req.params.id },
          data: { status: 'auto_submitted', submittedAt: new Date() }
        });
        return res.status(400).json({ success: false, message: 'Exam deadline has expired. Exam auto-submitted.', expired: true });
      }

      // Sanitize answers so client cannot inject unauthorized scores
      const sanitizedAnswers = Array.isArray(req.body.answers) ? req.body.answers.map(ans => ({
        questionId: ans.questionId,
        questionType: ans.questionType,
        selectedOptionId: ans.selectedOptionId || null,
        selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : -1,
        code: ans.code || '',
        language: ans.language || 'python',
        textAnswer: ans.textAnswer || '',
        studentMatches: ans.studentMatches || {},
        maxScore: Number(ans.maxScore) || 0
      })) : sub.answers;

      await prisma.submission.update({ where: { id: req.params.id }, data: { answers: sanitizedAnswers } });
      res.json({ success: true });
    });
  } catch (err) { 
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message }); 
  }
};

export const submitExam = async (req, res) => {
  try {
    const updatedSub = await withDbRetry(async () => {
      const sub = await prisma.submission.findUnique({
        where: { id: req.params.id },
        select: { id: true, studentId: true, examId: true, maxScore: true, answers: true, status: true }
      });
      if (!sub) {
        const error = new Error('Submission not found');
        error.status = 404;
        throw error;
      }
      if (sub.studentId !== req.user.id) {
        const error = new Error('Not authorized');
        error.status = 403;
        throw error;
      }

      // If already submitted, return existing submission idempotently
      if (['submitted', 'auto_submitted', 'force_submitted'].includes(sub.status)) {
        return sub;
      }

      const exam = await prisma.exam.findUnique({ 
        where: { id: sub.examId },
        select: {
          id: true,
          questions: {
            select: {
              id: true,
              type: true,
              points: true,
              timeLimitSeconds: true,
              options: { select: { id: true, text: true, isCorrect: true } },
              matchingPairs: { select: { id: true, leftItem: true, rightItem: true } },
              testCases: { select: { id: true, input: true, expectedOutput: true, isHidden: true, points: true } }
            }
          }
        }
      });
      
      if (!exam) {
        const error = new Error('Exam not found');
        error.status = 404;
        throw error;
      }

      let finalAnswers = req.body.answers || sub.answers || [];
      let totalScore = 0;

      const isForceKill = req.body.reason && (req.body.reason.toLowerCase().includes('termination') || req.body.reason.toLowerCase().includes('proctor'));

      for (let ans of finalAnswers) {
        const question = exam.questions.find(q => q.id === ans.questionId);
        if (!question) continue;

        const points = Number(question.points) || 10;

        if (question.type === 'mcq') {
          if (ans.selectedOptionId) {
            const correctOpt = question.options.find(o => o.isCorrect === true);
            ans.isCorrect = (correctOpt && correctOpt.id === ans.selectedOptionId);
          } else if (ans.selectedOption >= 0) {
            const correctIndex = question.options.findIndex(o => o.isCorrect === true);
            ans.isCorrect = (ans.selectedOption === correctIndex);
          } else {
            ans.isCorrect = false;
          }
          ans.score = ans.isCorrect ? points : 0;
        } 
        else if (question.type === 'matching') {
          let correctCount = 0;
          const totalPairs = question.matchingPairs?.length || 0;

          if (totalPairs > 0 && ans.studentMatches && typeof ans.studentMatches === 'object') {
            question.matchingPairs.forEach(pair => {
              if (ans.studentMatches[pair.id] === pair.id) correctCount++;
            });
            
            // ALL OR NOTHING LOGIC: Perfect or 0
            if (correctCount === totalPairs) {
              ans.score = points;
              ans.isCorrect = true;
            } else {
              ans.score = 0;
              ans.isCorrect = false;
            }
          } else {
            ans.score = 0;
            ans.isCorrect = false;
          }
        } 
        else if (question.type === 'coding' || question.type === 'Programming') {
          // Automated server-side test case evaluation
          if (ans.code && question.testCases && question.testCases.length > 0) {
            let passedCount = 0;
            const totalCases = question.testCases.length;
            for (const tc of question.testCases) {
              try {
                const r = await runCode(ans.language || 'python', ans.code, tc.input || '', Math.min(question.timeLimitSeconds || 3, 5));
                if (r.success && (r.output || '').trim() === (tc.expectedOutput || '').trim()) {
                  passedCount++;
                }
              } catch (err) {
                // Failed testcase
              }
            }
            ans.passedTests = passedCount;
            ans.totalTests = totalCases;
            ans.score = Math.round((passedCount / totalCases) * points);
            ans.isCorrect = passedCount === totalCases;
          } else {
            ans.score = 0;
            ans.isCorrect = false;
          }
        } else if (question.type === 'subjective' || question.type === 'essay') {
          // Subjective answers are graded by instructors
          ans.score = 0;
          ans.isCorrect = false;
        } else {
          ans.score = 0;
          ans.isCorrect = false;
        }

        ans.score = Math.min(Math.max(0, Number(ans.score) || 0), points);
        totalScore += ans.score;
      }

      if (isForceKill) {
        totalScore = 0;
        finalAnswers = finalAnswers.map(a => ({ ...a, score: 0, isCorrect: false }));
      }

      const maxScore = Number(sub.maxScore) || 0;
      totalScore = maxScore > 0 ? Math.min(totalScore, maxScore) : totalScore;
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      const finalStatus = isForceKill ? 'force_submitted' : (req.body.autoSubmit ? 'auto_submitted' : 'submitted');

      return await prisma.submission.update({
        where: { id: sub.id },
        data: {
          totalScore, 
          maxScore, 
          percentage,
          status: finalStatus,
          submittedAt: new Date(),
          answers: finalAnswers
        }
      });
    }, 4, 400);

    res.json({ success: true, data: { ...updatedSub, _id: updatedSub.id } });

    triggerDebouncedAggregation(updatedSub.examId);

  } catch (err) { 
    if (!res.headersSent) {
      res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
};

// ── Debounced Aggregation to prevent concurrent DB table scans ──
const pendingAggregations = new Map();
const triggerDebouncedAggregation = (examId) => {
  if (!examId || pendingAggregations.has(examId)) return;
  const timer = setTimeout(async () => {
    pendingAggregations.delete(examId);
    await aggregatePerformance(examId).catch(err => console.error("Error in aggregatePerformance:", err));
  }, 6000);
  pendingAggregations.set(examId, timer);
};

const aggregatePerformance = async (examId) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { examId, status: { in: ['submitted', 'auto_submitted', 'force_submitted'] } },
      select: { percentage: true }
    });
    
    if (submissions.length === 0) return;
    
    const totalAttendees = submissions.length;
    const scores = submissions.map(s => s.percentage || 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttendees;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    const passCount = scores.filter(s => s >= 40).length;
    const passRate = (passCount / totalAttendees) * 100;
    
    await prisma.examAnalytics.upsert({
      where: { examId },
      create: {
        examId,
        totalAttendees,
        averageScore,
        highestScore,
        lowestScore,
        passRate
      },
      update: {
        totalAttendees,
        averageScore,
        highestScore,
        lowestScore,
        passRate
      }
    });
  } catch (error) {
    console.error(`Failed to aggregate performance for exam ${examId}:`, error);
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { studentId: req.user.id },
      take: 50,
      select: {
        id: true,
        examId: true,
        studentId: true,
        totalScore: true,
        maxScore: true,
        percentage: true,
        violationCount: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        exam: {
          select: {
            title: true,
            status: true,
            course: true,
            schedule: {
              select: {
                durationMinutes: true,
                startDate: true,
                endDate: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: subs.map(s => ({ ...s, _id: s.id, exam: { ...s.exam, _id: s.examId, durationMinutes: s.exam?.schedule?.durationMinutes, startTime: s.exam?.schedule?.startDate, endTime: s.exam?.schedule?.endDate } })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExamSubmissions = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.examId },
      select: { id: true, creatorId: true, departmentId: true }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students are not authorized to view peer submissions.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && exam.creatorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are only authorized to view submissions for exams you created.' });
    }

    const subs = await prisma.submission.findMany({
      where: { examId: req.params.examId },
      take: 100,
      include: { student: { select: { name: true, email: true, studentId: true } } },
      orderBy: { totalScore: 'desc' }
    });
    res.json({ success: true, data: subs.map(s => ({ ...s, _id: s.id, student: { ...s.student, _id: s.studentId } })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};