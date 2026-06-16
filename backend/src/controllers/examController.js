import prisma from '../config/prisma.js';
import { getIO } from '../sockets/proctorSocket.js';

/** POST /api/exams — Create exam (faculty only) */
export const createExam = async (req, res) => {
  try {
    const { questions, proctoring, ...examData } = req.body;

    const formattedQuestions = questions?.map(q => ({
      type: q.type,
      title: q.title,
      description: q.description || '',
      points: q.points || 10,
      constraints: q.constraints || '',
      timeLimitSeconds: q.timeLimitSeconds || 5,
      options: q.options && q.options.length > 0 
        ? { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) } 
        : undefined,
      testCases: q.testCases && q.testCases.length > 0 
        ? { create: q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) } 
        : undefined
    }));

    const exam = await prisma.exam.create({
      data: {
        title: examData.title,
        description: examData.description,
        course: examData.course,
        startTime: examData.startTime ? new Date(examData.startTime) : null,
        durationMinutes: examData.durationMinutes || 60,
        status: examData.status || 'draft',
        proctoringRules: proctoring || {}, 
        creatorId: req.user.id, 
        questions: {
          create: formattedQuestions || []
        }
      },
      include: {
        questions: { include: { options: true, testCases: true } },
        creator: { select: { name: true, email: true } }
      }
    });

    const responseData = { ...exam, _id: exam.id, faculty: exam.creator };
    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    console.error("Create Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/exams — List all exams */
export const getExams = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher' || req.user.role === 'faculty') {
      filter = { creatorId: req.user.id };
    } else {
      filter = { status: { in: ['published', 'active', 'ended'] } };
    }

    const exams = await prisma.exam.findMany({
      where: filter,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        questions: { include: { options: true, testCases: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedExams = exams.map(exam => {
      const examCopy = { ...exam, _id: exam.id, faculty: { ...exam.creator, _id: exam.creator.id } };
      
      if (req.user.role === 'student') {
        examCopy.questions = examCopy.questions.map(q => {
          const qCopy = { ...q, _id: q.id };
          if (qCopy.testCases) {
            qCopy.testCases = qCopy.testCases.filter(tc => !tc.isHidden);
          }
          if (qCopy.options) {
            qCopy.options = qCopy.options.map(opt => ({ ...opt, isCorrect: undefined }));
          }
          return qCopy;
        });
      }
      return examCopy;
    });

    res.json({ success: true, data: formattedExams });
  } catch (err) {
    console.error("Get Exams Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/exams/:id — Get single exam */
export const getExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        questions: { include: { options: true, testCases: true } }
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const examCopy = { ...exam, _id: exam.id, faculty: { ...exam.creator, _id: exam.creator.id } };

    if (req.user.role === 'student') {
      examCopy.questions = examCopy.questions.map(q => {
        const qCopy = { ...q, _id: q.id };
        if (qCopy.testCases) qCopy.testCases = qCopy.testCases.filter(tc => !tc.isHidden);
        if (qCopy.options) qCopy.options = qCopy.options.map(opt => ({ ...opt, isCorrect: undefined }));
        return qCopy;
      });
    }

    res.json({ success: true, data: examCopy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/exams/:id — Update exam (faculty only) */
export const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const { questions, proctoring, ...examData } = req.body;

    const existingExam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existingExam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (existingExam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.question.deleteMany({ where: { examId: examId } });

    const formattedQuestions = questions?.map(q => ({
      type: q.type,
      title: q.title,
      description: q.description || '',
      points: q.points || 10,
      constraints: q.constraints || '',
      timeLimitSeconds: q.timeLimitSeconds || 5,
      options: q.options && q.options.length > 0 ? { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) } : undefined,
      testCases: q.testCases && q.testCases.length > 0 ? { create: q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) } : undefined
    }));

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        title: examData.title,
        description: examData.description,
        course: examData.course,
        startTime: examData.startTime ? new Date(examData.startTime) : null,
        durationMinutes: examData.durationMinutes || 60,
        status: examData.status || 'draft',
        proctoringRules: proctoring || {},
        questions: { create: formattedQuestions || [] }
      },
      include: { questions: { include: { options: true, testCases: true } }, creator: true }
    });

    res.json({ success: true, data: { ...updatedExam, _id: updatedExam.id } });
  } catch (err) {
    console.error("Update Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/exams/:id — Delete exam (faculty only) */
export const deleteExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PATCH /api/exams/:id/status — Change exam status */
export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updatedExam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { status: status }
    });
    
    if (status === 'published' || status === 'active') {
      try {
        const io = getIO();
        io.to('students_global').emit('exam_published', { ...updatedExam, _id: updatedExam.id });
      } catch (e) { console.error('Socket broadcast failed:', e); }
    }

    res.json({ success: true, data: { ...updatedExam, _id: updatedExam.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};