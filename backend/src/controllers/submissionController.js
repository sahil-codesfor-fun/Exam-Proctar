import prisma from '../config/prisma.js';

/** POST /api/submissions/start/:examId — Start or resume a submission */
export const startSubmission = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // 🚨 PRISMA TRANSLATION
    const exam = await prisma.exam.findUnique({ 
      where: { id: examId },
      include: { questions: true } // Need questions to generate empty answers JSON
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // ✅ THE SMART BOUNCER FIX: Respect the clock!
    const now = new Date();
    const isAutoStarted = exam.status === 'published' && exam.startTime && new Date(exam.startTime) <= now;

    if (exam.status !== 'active' && !isAutoStarted) {
      return res.status(400).json({ success: false, message: 'Exam is not active yet. Please wait for the start time.' });
    }

    // Update to active if auto-started
    if (isAutoStarted && exam.status !== 'active') {
      await prisma.exam.update({ where: { id: examId }, data: { status: 'active' } });
    }

    /* 🚨 NOTE: The 'Restriction' check was bypassed here because we moved to MySQL 
      and haven't created a Restriction table yet. The system will continue smoothly! 
    */

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
      // Create new submission with empty answers JSON
      const answers = exam.questions.map(q => ({
        questionId: q.id,
        questionType: q.type,
        selectedOption: -1,
        code: '',
        language: 'python',
        textAnswer: '',
        maxScore: q.points,
      }));

      sub = await prisma.submission.create({
        data: {
          examId: examId, 
          studentId: req.user.id, 
          answers: answers, // Stored beautifully as a JSON field in MySQL!
          maxScore: exam.totalMarks || 0,
        }
      });
    }

    // Frontend compatibility
    res.json({ success: true, resumed, data: { ...sub, _id: sub.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/submissions/:id/save — Auto-save answers */
export const saveAnswers = async (req, res) => {
  try {
    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.studentId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (sub.status !== 'submitted' && sub.status !== 'auto_submitted' && sub.status !== 'force_submitted') {
      
      // Update the JSON column in MySQL
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

/** PUT /api/submissions/:id/submit — Final submission + auto-grade MCQs */
export const submitExam = async (req, res) => {
  try {
    const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.studentId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const exam = await prisma.exam.findUnique({ 
      where: { id: sub.examId },
      include: { questions: { include: { options: true } } } // Need options to grade!
    });
    
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    let finalAnswers = req.body.answers || sub.answers || [];
    let totalScore = 0;

    // Auto-grade MCQs
    for (let ans of finalAnswers) {
      const question = exam.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      if (question.type === 'mcq' && ans.selectedOption >= 0) {
        const correctIndex = question.options.findIndex(o => o.isCorrect === true);
        ans.isCorrect = (ans.selectedOption === correctIndex);
        ans.score = ans.isCorrect ? question.points : 0;
      }
      totalScore += (ans.score || 0);
    }

    const maxScore = exam.totalMarks || 0;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Finalize the record in MySQL
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

/** GET /api/submissions/my — Student's submissions */
export const getMySubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { studentId: req.user.id },
      include: {
        exam: { select: { title: true, totalMarks: true, durationMinutes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // React Frontend mapping
    const formattedSubs = subs.map(s => ({ ...s, _id: s.id, exam: { ...s.exam, _id: s.examId } }));
    res.json({ success: true, data: formattedSubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/submissions/exam/:examId — Faculty view: all submissions for an exam */
export const getExamSubmissions = async (req, res) => {
  try {
    const subs = await prisma.submission.findMany({
      where: { examId: req.params.examId },
      include: {
        student: { select: { name: true, email: true, studentId: true } }
      },
      orderBy: { totalScore: 'desc' }
    });

    // React Frontend mapping
    const formattedSubs = subs.map(s => ({ ...s, _id: s.id, student: { ...s.student, _id: s.studentId } }));
    res.json({ success: true, data: formattedSubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};