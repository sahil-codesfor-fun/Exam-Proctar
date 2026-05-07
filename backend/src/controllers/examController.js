import Exam from '../models/Exam.js';

/** POST /api/exams — Create exam (faculty only) */
export const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, faculty: req.user._id });
    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/exams — List all exams (faculty sees own, student sees published/active) */
export const getExams = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') {
      filter = { faculty: req.user._id };
    } else {
      filter = { status: { $in: ['published', 'active', 'ended'] } };
      // User must be in allowedStudents (if it's not empty)
      filter.$or = [
        { allowedStudents: { $exists: true, $size: 0 } },
        { allowedStudents: { $exists: false } },
        { allowedStudents: req.user._id }
      ];
    }
    const exams = await Exam.find(filter)
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    // For students, hide hidden test cases from questions
    if (req.user.role === 'student') {
      exams.forEach(exam => {
        exam.questions.forEach(q => {
          if (q.testCases) {
            q.testCases = q.testCases.filter(tc => !tc.isHidden);
          }
          // Don't expose correct answers
          if (q.options) {
            q.options.forEach(opt => { opt.isCorrect = undefined; });
          }
        });
      });
    }

    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/exams/:id — Get single exam */
export const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('faculty', 'name email');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Hide answers/hidden test cases for students
    if (req.user.role === 'student') {
      exam.questions.forEach(q => {
        if (q.testCases) q.testCases = q.testCases.filter(tc => !tc.isHidden);
        if (q.options) q.options.forEach(opt => { opt.isCorrect = undefined; });
      });
    }

    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/exams/:id — Update exam (faculty only) */
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    Object.assign(exam, req.body);
    await exam.save();
    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/exams/:id — Delete exam (faculty only) */
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

import { getIO } from '../sockets/proctorSocket.js';

/** PATCH /api/exams/:id/status — Change exam status */
export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    exam.status = status;
    if (status === 'published') {
      exam.publishedAt = new Date();
    }
    await exam.save();
    
    // Broadcast deployment
    if (status === 'published' || status === 'active') {
      try {
        const io = getIO();
        io.to('students_global').emit('exam_published', exam);
      } catch (e) { console.error('Socket broadcast failed:', e); }
    }

    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
