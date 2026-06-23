import prisma from '../config/prisma.js';

// 🎲 Core Randomization Engine: The Fisher-Yates Shuffle
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
      include: { questions: { include: { options: true, matchingPairs: true } } } 
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const now = new Date();
    const isAutoStarted = exam.status === 'published' && exam.startTime && new Date(exam.startTime) <= now;

    if (exam.status !== 'active' && !isAutoStarted) {
      return res.status(400).json({ success: false, message: 'Exam is not active yet.' });
    }

    if (isAutoStarted && exam.status !== 'active') {
      await prisma.exam.update({ where: { id: examId }, data: { status: 'active' } });
    }

    let sub = await prisma.submission.findFirst({ 
      where: { examId: examId, studentId: req.user.id } 
    });

    if (sub && (sub.status === 'submitted' || sub.status === 'auto_submitted')) {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }
    if (sub && sub.status === 'force_submitted') {
      return res.status(403).json({ success: false, message: 'You have been disqualified from this exam' });
    }

    let resumed = false;
    if (sub) {
      resumed = true;
    } else {
      let pool = [...exam.questions];
      const isRandomized = exam.randomizeQuestions === true || exam.randomizeQuestions === 'true' || exam.randomizeQuestions === 1;
      
      const marksOverride = isRandomized && exam.proctoringRules?.marksPerNode 
        ? parseInt(exam.proctoringRules.marksPerNode, 10) 
        : null;

      if (isRandomized) {
         pool = shuffleArray(pool); 
         const serveLimit = parseInt(exam.questionsToServe, 10);
         if (!isNaN(serveLimit) && serveLimit > 0) {
           pool = pool.slice(0, serveLimit); 
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
           // 🚀 Bipartite Mapping Randomization!
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
          studentMatches: {}, // 👈 Dictionary to store { leftId: rightId }
          maxScore: marksOverride || q.points, 
          options: options,
          matchingLeft: matchingLeft,
          matchingRight: matchingRight
        };
      });

      const dynamicMaxScore = pool.reduce((acc, q) => acc + (marksOverride || q.points || 10), 0);

      sub = await prisma.submission.create({
        data: {
          examId: examId, 
          studentId: req.user.id, 
          answers: answers, 
          maxScore: isRandomized ? dynamicMaxScore : (exam.totalMarks || dynamicMaxScore),
        }
      });
    }

    res.json({ success: true, resumed, data: { ...sub, _id: sub.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveAnswers = async (req, res) => {
  try {
    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.studentId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    
    if (sub.status !== 'submitted' && sub.status !== 'auto_submitted' && sub.status !== 'force_submitted') {
      await prisma.submission.update({
        where: { id: req.params.id },
        data: { answers: req.body.answers }
      });
      res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'Cannot modify a submitted exam' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitExam = async (req, res) => {
  try {
    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.studentId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const exam = await prisma.exam.findUnique({ 
      where: { id: sub.examId },
      include: { questions: { include: { options: true, matchingPairs: true } } } 
    });
    
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    let finalAnswers = req.body.answers || sub.answers || [];
    let totalScore = 0;
    
    const marksOverride = exam.randomizeQuestions === true && exam.proctoringRules?.marksPerNode 
        ? parseInt(exam.proctoringRules.marksPerNode, 10) 
        : null;

    for (let ans of finalAnswers) {
      const question = exam.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

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
        ans.score = ans.isCorrect ? (marksOverride || question.points) : 0;
      } 
      // 🚀 NEW: The Partial Grading Logic for Matching!
      else if (question.type === 'matching') {
        let correctCount = 0;
        const totalPairs = question.matchingPairs?.length || 0;

        if (totalPairs > 0 && ans.studentMatches) {
          question.matchingPairs.forEach(pair => {
            // Because we cleverly mapped both left and right to pair.id, 
            // a correct match means the student linked the leftId exactly to its native rightId
            if (ans.studentMatches[pair.id] === pair.id) {
              correctCount++;
            }
          });
          const fraction = correctCount / totalPairs;
          ans.score = Math.round(fraction * (marksOverride || question.points));
          ans.isCorrect = correctCount === totalPairs;
        } else {
          ans.score = 0;
          ans.isCorrect = false;
        }
      }

      totalScore += (ans.score || 0);
    }

    const maxScore = sub.maxScore || 0;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const updatedSub = await prisma.submission.update({
      where: { id: sub.id },
      data: {
        totalScore,
        maxScore,
        percentage,
        status: req.body.autoSubmit ? 'auto_submitted' : 'submitted',
        answers: finalAnswers
      }
    });

    res.json({ success: true, data: { ...updatedSub, _id: updatedSub.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { studentId: req.user.id },
      include: {
        exam: { select: { title: true, durationMinutes: true, endTime: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSubs = subs.map(s => ({ ...s, _id: s.id, exam: { ...s.exam, _id: s.examId } }));
    res.json({ success: true, data: formattedSubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExamSubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { examId: req.params.examId },
      include: {
        student: { select: { name: true, email: true, studentId: true } }
      },
      orderBy: { totalScore: 'desc' }
    });

    const formattedSubs = subs.map(s => ({ ...s, _id: s.id, student: { ...s.student, _id: s.studentId } }));
    res.json({ success: true, data: formattedSubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};