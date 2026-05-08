import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';
import Restriction from '../models/Restriction.js';

/** POST /api/submissions/start/:examId — Start or resume a submission */
export const startSubmission = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // ✅ THE SMART BOUNCER FIX: Respect the clock!
    const now = new Date();
    const isAutoStarted = exam.status === 'published' && exam.startTime && new Date(exam.startTime) <= now;

    if (exam.status !== 'active' && !isAutoStarted) {
      return res.status(400).json({ success: false, message: 'Exam is not active yet. Please wait for the start time.' });
    }

    // Optional but awesome: If the student triggers the auto-start, update the DB so the teacher sees it as "ACTIVE" too!
    if (isAutoStarted && exam.status !== 'active') {
      exam.status = 'active';
      await exam.save();
    }

    // Check restrictions
    const restriction = await Restriction.findOne({
      student: req.user._id, exam: examId, isActive: true, expiresAt: { $gt: new Date() }
    });
    if (restriction) {
      const mins = Math.ceil((restriction.expiresAt - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `You are restricted from this exam. Try again in ${mins} minutes.`,
        restriction: { reason: restriction.reason, expiresAt: restriction.expiresAt }
      });
    }

    let sub = await Submission.findOne({ exam: examId, student: req.user._id });
    if (sub && (sub.status === 'submitted' || sub.status === 'auto_submitted')) {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }
    if (sub && sub.status === 'disqualified') {
      return res.status(403).json({ success: false, message: 'You have been disqualified from this exam' });
    }

    let resumed = false;
    if (sub) {
      resumed = true;
    } else {
      try {
        // Create new submission with empty answers
        const answers = exam.questions.map(q => ({
          questionId: q._id.toString(),
          questionType: q.type,
          selectedOption: -1,
          code: '',
          language: 'python',
          textAnswer: '',
          maxScore: q.points,
        }));
        sub = await Submission.create({
          exam: examId, student: req.user._id, answers, maxScore: exam.totalMarks,
        });
      } catch (err) {
        // Handle race condition where two requests try to create the same submission simultaneously
        if (err.code === 11000) {
          sub = await Submission.findOne({ exam: examId, student: req.user._id });
          resumed = true;
          if (!sub) throw err; // Should not happen given the error code
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true, resumed, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/submissions/:id/save — Auto-save answers */
export const saveAnswers = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (sub.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Cannot modify a submitted exam' });
    }
    sub.answers = req.body.answers;
    await sub.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/submissions/:id/submit — Final submission + auto-grade MCQs */
export const submitExam = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const exam = await Exam.findById(sub.exam);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Update answers from request
    if (req.body.answers) sub.answers = req.body.answers;

    // Auto-grade MCQs
    let totalScore = 0;
    for (const ans of sub.answers) {
      const question = exam.questions.id(ans.questionId);
      if (!question) continue;

      if (question.type === 'mcq' && ans.selectedOption >= 0) {
        const correct = question.options.findIndex(o => o.isCorrect === true);
        ans.isCorrect = ans.selectedOption === correct;
        ans.score = ans.isCorrect ? question.points : 0;
      }
      // Coding questions scored via separate judge endpoint
      totalScore += (ans.score || 0);
    }

    sub.totalScore = totalScore;
    sub.maxScore = exam.totalMarks;
    sub.percentage = exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
    sub.status = req.body.autoSubmit ? 'auto_submitted' : 'submitted';
    sub.autoSubmit = !!req.body.autoSubmit;
    sub.autoSubmitReason = req.body.reason || '';
    sub.submittedAt = new Date();

    await sub.save();
    res.json({ success: true, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/submissions/my — Student's submissions */
export const getMySubmissions = async (req, res) => {
  try {
    const subs = await Submission.find({ student: req.user._id })
      .populate('exam', 'title totalMarks passingMarks durationMinutes')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/submissions/exam/:examId — Faculty view: all submissions for an exam */
export const getExamSubmissions = async (req, res) => {
  try {
    const subs = await Submission.find({ exam: req.params.examId })
      .populate('student', 'name email studentId')
      .sort({ totalScore: -1 });
    res.json({ success: true, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};