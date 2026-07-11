import prisma from '../config/prisma.js';
import { getIO } from '../sockets/proctorSocket.js';

export const createExam = async (req, res) => {
  try {
    const { questions, proctoring, randomizeQuestions, questionsToServe, targetBatch, targetSection, departmentId, subjectId, ...examData } = req.body;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    // Role based access check
    if (req.user.role !== 'superadmin' && req.user.departmentId && req.user.departmentId !== departmentId) {
      return res.status(403).json({ success: false, message: 'You can only create exams for your own department' });
    }

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

    const examCode = `EXAM-TCH-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    const exam = await prisma.$transaction(async (tx) => {
      return tx.exam.create({
        data: {
          title: examData.title,
          examCode,
          description: examData.description,
          course: examData.course,
          targetBatch: targetBatch || null,
          targetSection: targetSection || null,
          departmentId: departmentId,
          subjectId: subjectId || null,
          status: examData.status || 'draft',
          creatorId: req.user.id,
          schedule: {
            create: {
              startDate: examData.startTime ? new Date(examData.startTime) : new Date(),
              endDate: examData.endTime ? new Date(examData.endTime) : new Date(Date.now() + (examData.durationMinutes || 60) * 60000),
              durationMinutes: examData.durationMinutes || 60,
            }
          },
          settings: {
            create: {
              randomizeQuestions: isRand,
              questionPoolSize: serveNum,
              browserLock: proctoring?.requireFullscreen || false,
              fullscreenRequired: proctoring?.requireFullscreen || false,
              aiFaceDetection: proctoring?.enableWebcam || false,
              clipboardDetection: proctoring?.disableCopyPaste !== false, // Defaults to true
              autoTerminateViolations: proctoring?.maxViolations ? parseInt(proctoring.maxViolations, 10) : 5,
            }
          },
          questions: { create: formattedQuestions || [] }
        },
        include: { questions: { include: { options: true, testCases: true, matchingPairs: true } }, creator: { select: { name: true, email: true } }, settings: true, schedule: true }
      });
    });

    const responseData = {
      ...exam,
      _id: exam.id,
      faculty: exam.creator,
      proctoring: proctoring || {},
      randomizeQuestions: exam.settings?.randomizeQuestions,
      questionsToServe: exam.settings?.questionPoolSize
    };

    if (responseData.status === 'published' || responseData.status === 'active') {
      try { const io = getIO(); io.emit('exam_published', responseData); } catch (e) { console.error(e); }
    }

    res.status(201).json({ success: true, data: responseData, message: "Exam deployed successfully" });
  } catch (err) {
    console.error("Create Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExams = async (req, res) => {
  try {
    let filter = {};
    if (['teacher', 'faculty', 'admin', 'superadmin'].includes(req.user.role)) {
      filter = { creatorId: req.user.id };
    } else {
      const student = await prisma.user.findUnique({ where: { id: req.user.id } });
      const batch = student?.studentId && student.studentId.length >= 2 ? '20' + student.studentId.substring(0, 2) : null;

      const studentCourse = student?.course || '';
      const allowedCourses = [studentCourse];
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
      include: { creator: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } }, questions: { include: { options: true, testCases: true, matchingPairs: true } }, settings: true, schedule: true },
      orderBy: { createdAt: 'desc' }
    });

    const formattedExams = exams.map(exam => {
      try {
        const proctoring = {
          maxViolations: exam.settings?.autoTerminateViolations || 3,
          requireFullscreen: exam.settings?.fullscreenRequired || false,
          enableWebcam: exam.settings?.aiFaceDetection || false,
          disableCopyPaste: exam.settings?.clipboardDetection !== false,
        };
        const examCopy = {
          ...exam,
          _id: exam.id,
          faculty: exam.creator ? { ...exam.creator, _id: exam.creator.id } : { name: 'Academic Core', _id: 'system' },
          proctoring,
          randomizeQuestions: exam.settings?.randomizeQuestions || false,
          questionsToServe: exam.settings?.questionPoolSize || null,
          startTime: exam.schedule?.startDate,
          endTime: exam.schedule?.endDate,
          durationMinutes: exam.schedule?.durationMinutes
        };

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
  } catch (err) {
    console.error("Get Exams Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { creator: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } }, questions: { include: { options: true, testCases: true, matchingPairs: true } }, settings: true, schedule: true }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const proctoring = {
      maxViolations: exam.settings?.autoTerminateViolations || 3,
      requireFullscreen: exam.settings?.fullscreenRequired || false,
      enableWebcam: exam.settings?.aiFaceDetection || false,
      disableCopyPaste: exam.settings?.clipboardDetection !== false,
    };

    const examCopy = {
      ...exam,
      _id: exam.id,
      faculty: exam.creator ? { ...exam.creator, _id: exam.creator.id } : { name: 'Academic Core', _id: 'system' },
      proctoring,
      randomizeQuestions: exam.settings?.randomizeQuestions || false,
      questionsToServe: exam.settings?.questionPoolSize || null,
      startTime: exam.schedule?.startDate,
      endTime: exam.schedule?.endDate,
      durationMinutes: exam.schedule?.durationMinutes
    };

    if (req.user.role === 'student') {
      const rescheduleTicket = await prisma.missedExamTicket.findFirst({
        where: { examId: exam.id, studentId: req.user.id, isRescheduled: true, status: 'approved' }
      });
      if (rescheduleTicket && rescheduleTicket.rescheduledStartTime && rescheduleTicket.rescheduledEndTime) {
         examCopy.startTime = rescheduleTicket.rescheduledStartTime;
         examCopy.endTime = rescheduleTicket.rescheduledEndTime;
         examCopy.durationMinutes = Math.round((new Date(rescheduleTicket.rescheduledEndTime) - new Date(rescheduleTicket.rescheduledStartTime)) / 60000);
      }

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
  } catch (err) {
    console.error("Get Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const { questions, proctoring, randomizeQuestions, questionsToServe, targetBatch, targetSection, departmentId, subjectId, ...examData } = req.body;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    // Role based access check
    if (req.user.role !== 'superadmin' && req.user.departmentId && req.user.departmentId !== departmentId) {
      return res.status(403).json({ success: false, message: 'You can only update exams for your own department' });
    }

    const isRand = req.body.randomizeQuestions === true || req.body.randomizeQuestions === 'true';
    const serveNum = req.body.questionsToServe ? parseInt(req.body.questionsToServe, 10) : null;

    const existingExam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existingExam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (existingExam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const formattedQuestions = questions?.map(q => ({
      type: q.type, title: q.title, description: q.description || '', points: q.points || 10, constraints: q.constraints || '', timeLimitSeconds: q.timeLimitSeconds || 5,
      options: q.options && q.options.length > 0 ? { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) } : undefined,
      testCases: q.testCases && q.testCases.length > 0 ? { create: q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) } : undefined,
      matchingPairs: q.matchingPairs && q.matchingPairs.length > 0 ? { create: q.matchingPairs.map(mp => ({ leftItem: mp.leftItem, rightItem: mp.rightItem })) } : undefined
    }));

    const updatedExam = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { examId: examId } });

      return tx.exam.update({
        where: { id: examId },
        data: {
          title: examData.title, description: examData.description, course: examData.course,
          targetBatch: targetBatch || null, targetSection: targetSection || null,
          departmentId: departmentId, subjectId: subjectId || null,
          status: examData.status || 'draft',
          schedule: {
            upsert: {
              create: {
                startDate: examData.startTime ? new Date(examData.startTime) : new Date(),
                endDate: examData.endTime ? new Date(examData.endTime) : new Date(Date.now() + (examData.durationMinutes || 60) * 60000),
                durationMinutes: examData.durationMinutes || 60,
              },
              update: {
                startDate: examData.startTime ? new Date(examData.startTime) : new Date(),
                endDate: examData.endTime ? new Date(examData.endTime) : new Date(Date.now() + (examData.durationMinutes || 60) * 60000),
                durationMinutes: examData.durationMinutes || 60,
              }
            }
          },
          settings: {
            upsert: {
              create: {
                randomizeQuestions: isRand,
                questionPoolSize: serveNum,
                browserLock: proctoring?.requireFullscreen || false,
                fullscreenRequired: proctoring?.requireFullscreen || false,
                aiFaceDetection: proctoring?.enableWebcam || false,
                clipboardDetection: proctoring?.disableCopyPaste !== false,
                autoTerminateViolations: proctoring?.maxViolations ? parseInt(proctoring.maxViolations, 10) : 5,
              },
              update: {
                randomizeQuestions: isRand,
                questionPoolSize: serveNum,
                browserLock: proctoring?.requireFullscreen || false,
                fullscreenRequired: proctoring?.requireFullscreen || false,
                aiFaceDetection: proctoring?.enableWebcam || false,
                clipboardDetection: proctoring?.disableCopyPaste !== false,
                autoTerminateViolations: proctoring?.maxViolations ? parseInt(proctoring.maxViolations, 10) : 5,
              }
            }
          },
          questions: { create: formattedQuestions || [] }
        },
        include: { questions: { include: { options: true, testCases: true, matchingPairs: true } }, creator: true, settings: true, schedule: true }
      });
    });

    const responseData = {
      ...updatedExam,
      _id: updatedExam.id,
      proctoring: proctoring || {},
      randomizeQuestions: updatedExam.settings?.randomizeQuestions,
      questionsToServe: updatedExam.settings?.questionPoolSize
    };

    if (responseData.status === 'published' || responseData.status === 'active') {
      try { const io = getIO(); io.emit('exam_published', responseData); } catch (e) { console.error(e); }
    }
    res.json({ success: true, data: responseData, message: "Exam updated successfully" });
  } catch (err) {
    console.error("Update Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.exam.delete({ where: { id: req.params.id } });
    try { const io = getIO(); io.emit('exam_deleted', { examId: req.params.id }); } catch (e) { }
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    console.error("Delete Exam Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updatedExam = await prisma.exam.update({ where: { id: req.params.id }, data: { status: status }, include: { settings: true, schedule: true } });
    const responseData = { ...updatedExam, _id: updatedExam.id };

    try { const io = getIO(); io.emit('exam_status_changed', { examId: updatedExam.id, status }); io.emit('exam_published', responseData); } catch (e) { }
    res.json({ success: true, data: responseData, message: "Status updated successfully" });
  } catch (err) {
    console.error("Update Exam Status Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};