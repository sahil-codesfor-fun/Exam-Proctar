import prisma from '../../config/prisma.js';

export const createExam = async (data) => {
  const { settings, schedule, ...examData } = data;
  
  if (!examData.examCode) {
    examData.examCode = `EXAM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
  }

  return prisma.exam.create({
    data: {
      ...examData,
      settings: settings ? { create: settings } : undefined,
      schedule: schedule ? { create: schedule } : undefined,
    },
    include: {
      settings: true,
      schedule: true,
    },
  });
};

export const getAllExams = async (filters = {}) => {
  const query = {
    include: {
      department: true,
      subject: true,
      creator: { select: { name: true, email: true } },
      _count: { select: { questions: true, assignments: true, attempts: true } }
    },
    orderBy: { createdAt: 'desc' }
  };

  if (filters.status) {
    query.where = { ...query.where, status: filters.status };
  }
  if (filters.departmentId) {
    query.where = { ...query.where, departmentId: filters.departmentId };
  }

  return prisma.exam.findMany(query);
};

export const getExamById = async (id) => {
  return prisma.exam.findUnique({
    where: { id },
    include: {
      settings: true,
      schedule: true,
      department: true,
      subject: true,
      questions: {
        include: {
          options: true,
          testCases: true,
          programmingDetails: true
        }
      },
      assignments: true
    },
  });
};

export const updateExam = async (id, data) => {
  const { settings, schedule, ...examData } = data;
  
  return prisma.exam.update({
    where: { id },
    data: {
      ...examData,
      settings: settings ? { upsert: { create: settings, update: settings } } : undefined,
      schedule: schedule ? { upsert: { create: schedule, update: schedule } } : undefined,
    },
    include: {
      settings: true,
      schedule: true,
    },
  });
};

export const deleteExam = async (id) => {
  return prisma.exam.delete({
    where: { id },
  });
};

export const updateExamStatus = async (id, status) => {
  return prisma.exam.update({
    where: { id },
    data: { status },
  });
};

export const duplicateExam = async (id, creatorId) => {
  const original = await getExamById(id);
  if (!original) throw new Error('Original exam not found');

  const { id: _, createdAt, updatedAt, examCode, settings, schedule, questions, assignments, ...examData } = original;
  
  const newCode = `EXAM-COPY-${Math.floor(1000 + Math.random() * 9000)}`;

  const duplicatedSettings = settings ? {
    create: {
      ...settings,
      id: undefined,
      examId: undefined
    }
  } : undefined;

  const duplicatedSchedule = schedule ? {
    create: {
      ...schedule,
      id: undefined,
      examId: undefined
    }
  } : undefined;

  const duplicatedQuestions = questions && questions.length > 0 ? {
    create: questions.map(q => {
      const { id, examId, options, testCases, programmingDetails, ...qData } = q;
      return {
        ...qData,
        options: options && options.length > 0 ? { create: options.map(o => ({ ...o, id: undefined, questionId: undefined })) } : undefined,
        testCases: testCases && testCases.length > 0 ? { create: testCases.map(tc => ({ ...tc, id: undefined, questionId: undefined })) } : undefined,
        programmingDetails: programmingDetails ? { create: { ...programmingDetails, id: undefined, questionId: undefined } } : undefined,
      }
    })
  } : undefined;

  return prisma.exam.create({
    data: {
      ...examData,
      title: `${examData.title} (Copy)`,
      examCode: newCode,
      creatorId,
      status: 'draft',
      settings: duplicatedSettings,
      schedule: duplicatedSchedule,
      questions: duplicatedQuestions,
    },
  });
};

export const assignExam = async (examId, assignmentData) => {
  return prisma.examAssignment.create({
    data: {
      examId,
      ...assignmentData
    }
  });
};

export const addQuestionToExam = async (examId, questionData) => {
  const { options, testCases, programmingDetails, ...qData } = questionData;
  return prisma.question.create({
    data: {
      ...qData,
      examId,
      options: options ? { create: options } : undefined,
      testCases: testCases ? { create: testCases } : undefined,
      programmingDetails: programmingDetails ? { create: programmingDetails } : undefined,
    }
  });
};

export const updateQuestion = async (examId, questionId, questionData) => {
  const { options, testCases, programmingDetails, ...qData } = questionData;
  
  await prisma.$transaction([
    prisma.questionOption.deleteMany({ where: { questionId } }),
    prisma.testCase.deleteMany({ where: { questionId } }),
    prisma.programmingQuestion.deleteMany({ where: { questionId } }),
  ]);

  return prisma.question.update({
    where: { id: questionId },
    data: {
      ...qData,
      options: options && options.length > 0 ? { create: options } : undefined,
      testCases: testCases && testCases.length > 0 ? { create: testCases } : undefined,
      programmingDetails: programmingDetails ? { create: programmingDetails } : undefined,
    }
  });
};

export const removeQuestion = async (examId, questionId) => {
  return prisma.question.delete({
    where: { id: questionId }
  });
};

export const getExamResults = async (examId) => {
  return prisma.examResult.findMany({
    where: { examId },
    include: {
      student: { select: { id: true, name: true, email: true, studentId: true } },
      attempt: true
    },
    orderBy: { marks: 'desc' }
  });
};

export const getExamAnalytics = async (examId) => {
  const analytics = await prisma.examAnalytics.findUnique({ where: { examId } });
  if (analytics) return analytics;

  const results = await getExamResults(examId);
  const totalAttendees = results.length;
  if (totalAttendees === 0) return null;

  const averageScore = results.reduce((acc, curr) => acc + curr.marks, 0) / totalAttendees;
  const passed = results.filter(r => r.passFail === 'PASS').length;
  const passRate = (passed / totalAttendees) * 100;
  
  return {
    totalAttendees,
    averageScore,
    passRate,
    highestScore: Math.max(...results.map(r => r.marks)),
    lowestScore: Math.min(...results.map(r => r.marks)),
  }
};
