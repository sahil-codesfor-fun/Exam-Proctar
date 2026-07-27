import * as examService from '../../services/superadmin/examService.js';
import prisma from '../../config/prisma.js';
export const createExam = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    if (req.body.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: req.body.subjectId } });
      if (!subject || subject.departmentId !== req.user.departmentId) {
        return res.status(403).json({ success: false, message: 'Invalid subject or unauthorized subject selection' });
      }
    }
    const examData = { ...req.body, creatorId: req.user.id, departmentId: req.user.departmentId };
    const exam = await examService.createExam(examData);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Create Exam Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const filters = { ...req.query, departmentId: req.user.departmentId };
    const exams = await examService.getAllExams(filters);
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await examService.getExamById(req.params.id);
    if (!exam || exam.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    if (req.body.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: req.body.subjectId } });
      if (!subject || subject.departmentId !== req.user.departmentId) {
        return res.status(403).json({ success: false, message: 'Invalid subject or unauthorized subject selection' });
      }
    }
    const examData = { ...req.body, departmentId: req.user.departmentId };
    const exam = await examService.updateExam(req.params.id, examData);
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    await examService.deleteExam(req.params.id);
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const exam = await examService.updateExamStatus(req.params.id, 'published');
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const archiveExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const exam = await examService.updateExamStatus(req.params.id, 'archived');
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const duplicateExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const exam = await examService.duplicateExam(req.params.id, req.user.id);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignExam = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    
    const payload = {
      ...req.body,
      departmentId: req.user.departmentId
    };
    if (payload.assignType === 'university') {
      return res.status(403).json({ success: false, message: 'Admins cannot assign exams to the entire university' });
    }

    const assignment = await examService.assignExam(req.params.id, payload);
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const question = await examService.addQuestionToExam(req.params.id, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const question = await examService.updateQuestion(req.params.id, req.params.questionId, req.body);
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeQuestion = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    await examService.removeQuestion(req.params.id, req.params.questionId);
    res.status(200).json({ success: true, message: 'Question removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamResults = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const results = await examService.getExamResults(req.params.id);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamAnalytics = async (req, res) => {
  try {
    const examCheck = await examService.getExamById(req.params.id);
    if (!examCheck || examCheck.departmentId !== req.user.departmentId) {
      return res.status(404).json({ success: false, message: 'Exam not found or access denied' });
    }
    const analytics = await examService.getExamAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
