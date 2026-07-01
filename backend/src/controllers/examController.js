import prisma from '../config/prisma.js';
import { getIO } from '../sockets/proctorSocket.js';

export const createExam = async (req, res) => {
  try {
    const { questions, proctoring, randomizeQuestions, questionsToServe, targetBatch, targetSection, ...examData } = req.body;

    const isRand = req.body.randomizeQuestions === true || req.body.randomizeQuestions === 'true';
    const serveNum = req.body.questionsToServe ? parseInt(req.body.questionsToServe, 10) : null;

    const formattedQuestions = questions?.map(q => ({
      type: q.type,
      title: q.title,
      description: q.description || '',
      points: q.points || 10,
      constraints: q.constraints || '',
      timeLimitSeconds: q.timeLimitSeconds || 5,
      options: q.options && q.options.length > 0 ? { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) } : undefined,
      testCases: q.testCases && q.testCases.length > 0 ? { create: q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) } : undefined,
      matchingPairs: q.matchingPairs && q.matchingPairs.length > 0 ? { create: q.matchingPairs.map(mp => ({ leftItem: mp.leftItem, rightItem: mp.rightItem })) } : undefined
    }));

    const exam = await prisma.exam.create({
      data: {
        title: examData.title,
        description: examData.description,
        course: examData.course,
        targetBatch: targetBatch || null,     
        targetSection: targetSection || null, 
        startTime: examData.startTime ? new Date(examData.startTime) : null,
        endTime: examData.endTime ? new Date(examData.endTime) : null,
        durationMinutes: examData.durationMinutes || 60,
        status: examData.status || 'draft',
        randomizeQuestions: isRand, 
        questionsToServe: serveNum,      
        proctoringRules: proctoring || {}, 
        creatorId: req.user.id, 
        questions: { create: formattedQuestions || [] }
      },
      include: { questions: { include: { options: true, testCases: true, matchingPairs: true } }, creator: { select: { name: true, email: true } } }
    });

    const responseData = { ...exam, _id: exam.id, faculty: exam.creator, proctoring: exam.proctoringRules };

    if (responseData.status === 'published' || responseData.status === 'active') {
      try { const io = getIO(); io.emit('exam_published', responseData); } catch (e) {}
    }

    res.status(201).json({ success: true, data: responseData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExams = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher' || req.user.role === 'faculty') {
      filter = { creatorId: req.user.id };
    } else {
      const student = await prisma.user.findUnique({ where: { id: req.user.id } });
      const batch = student?.studentId && student.studentId.length >= 2 ? '20' + student.studentId.substring(0, 2) : null;
      
      // 🚀 THE SPECIALIZATION UMBRELLA LOGIC
      const studentCourse = student?.course || '';
      const allowedCourses = [studentCourse];
      
      // If the student's course is a specialization (contains "B.Tech CSE"), they are also allowed to take exams targeted purely at the parent "B.Tech CSE"
      if (studentCourse.startsWith('B.Tech CSE') && studentCourse !== 'B.Tech CSE') {
          allowedCourses.push('B.Tech CSE');
      }

      filter = {
        status: { in: ['published', 'active', 'ended'] },
        AND: [
          { OR: [{ course: null }, { course: '' }, { course: { in: allowedCourses } }] },
          { OR: [{ targetBatch: null }, { targetBatch: '' }, { targetBatch: batch || '' }] },
          { OR: [{ targetSection: null }, { targetSection: '' }, { targetSection: student?.section || '' }] }
        ]
      };
    }

    const exams = await prisma.exam.findMany({
      where: filter,
      include: { creator: { select: { id: true, name: true, email: true } }, questions: { include: { options: true, testCases: true, matchingPairs: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const formattedExams = exams.map(exam => {
      try {
        const examCopy = { ...exam, _id: exam.id, faculty: exam.creator ? { ...exam.creator, _id: exam.creator.id } : { name: 'Academic Core', _id: 'system' }, proctoring: exam.proctoringRules || {}, randomizeQuestions: exam.randomizeQuestions || false, questionsToServe: exam.questionsToServe || null };
        if (req.user.role === 'student') {
          const marksOverride = examCopy.randomizeQuestions && examCopy.proctoring?.marksPerNode ? parseInt(examCopy.proctoring.marksPerNode, 10) : null;
          examCopy.questions = (examCopy.questions || []).map(q => {
            const qCopy = { ...q, _id: q.id };
            if (marksOverride) qCopy.points = marksOverride; 
            if (qCopy.testCases) qCopy.testCases = qCopy.testCases.filter(tc => !tc.isHidden);
            if (qCopy.options) qCopy.options = qCopy.options.map(opt => ({ ...opt, isCorrect: undefined }));
            return qCopy;
          });
        }
        return examCopy;
      } catch (mappingError) { return exam; }
    });

    res.json({ success: true, data: formattedExams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { creator: { select: { id: true, name: true, email: true } }, questions: { include: { options: true, testCases: true, matchingPairs: true } } }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const examCopy = { ...exam, _id: exam.id, faculty: exam.creator ? { ...exam.creator, _id: exam.creator.id } : { name: 'Academic Core', _id: 'system' }, proctoring: exam.proctoringRules || {} };

    if (req.user.role === 'student') {
      const marksOverride = examCopy.randomizeQuestions && examCopy.proctoring?.marksPerNode ? parseInt(examCopy.proctoring.marksPerNode, 10) : null;
      examCopy.questions = (examCopy.questions || []).map(q => {
        const qCopy = { ...q, _id: q.id };
        if (marksOverride) qCopy.points = marksOverride; 
        if (qCopy.testCases) qCopy.testCases = qCopy.testCases.filter(tc => !tc.isHidden);
        if (qCopy.options) qCopy.options = qCopy.options.map(opt => ({ ...opt, isCorrect: undefined }));
        return qCopy;
      });
    }
    res.json({ success: true, data: examCopy });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const { questions, proctoring, randomizeQuestions, questionsToServe, targetBatch, targetSection, ...examData } = req.body;

    const isRand = req.body.randomizeQuestions === true || req.body.randomizeQuestions === 'true';
    const serveNum = req.body.questionsToServe ? parseInt(req.body.questionsToServe, 10) : null;

    const existingExam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existingExam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (existingExam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.question.deleteMany({ where: { examId: examId } });

    const formattedQuestions = questions?.map(q => ({
      type: q.type, title: q.title, description: q.description || '', points: q.points || 10, constraints: q.constraints || '', timeLimitSeconds: q.timeLimitSeconds || 5,
      options: q.options && q.options.length > 0 ? { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) } : undefined,
      testCases: q.testCases && q.testCases.length > 0 ? { create: q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) } : undefined,
      matchingPairs: q.matchingPairs && q.matchingPairs.length > 0 ? { create: q.matchingPairs.map(mp => ({ leftItem: mp.leftItem, rightItem: mp.rightItem })) } : undefined
    }));

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        title: examData.title, description: examData.description, course: examData.course,
        targetBatch: targetBatch || null, targetSection: targetSection || null,
        startTime: examData.startTime ? new Date(examData.startTime) : null, endTime: examData.endTime ? new Date(examData.endTime) : null,
        durationMinutes: examData.durationMinutes || 60, status: examData.status || 'draft', randomizeQuestions: isRand, questionsToServe: serveNum, proctoringRules: proctoring || {}, questions: { create: formattedQuestions || [] }
      },
      include: { questions: { include: { options: true, testCases: true, matchingPairs: true } }, creator: true }
    });

    const responseData = { ...updatedExam, _id: updatedExam.id, proctoring: updatedExam.proctoringRules };

    if (responseData.status === 'published' || responseData.status === 'active') {
      try { const io = getIO(); io.emit('exam_published', responseData); } catch (e) {}
    }
    res.json({ success: true, data: responseData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.exam.delete({ where: { id: req.params.id } });
    try { const io = getIO(); io.emit('exam_deleted', { examId: req.params.id }); } catch (e) {}
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updatedExam = await prisma.exam.update({ where: { id: req.params.id }, data: { status: status } });
    const responseData = { ...updatedExam, _id: updatedExam.id, proctoring: updatedExam.proctoringRules };

    try { const io = getIO(); io.emit('exam_status_changed', { examId: updatedExam.id, status }); io.emit('exam_published', responseData); } catch (e) {}
    res.json({ success: true, data: responseData });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};