import * as examService from '../../services/superadmin/examService.js';

export const createExam = async (req, res) => {
  try {
    const examData = { ...req.body, creatorId: req.user.id };
    const exam = await examService.createExam(examData);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Create Exam Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const filters = req.query;
    const exams = await examService.getAllExams(filters);
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await examService.getExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await examService.updateExam(req.params.id, req.body);
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    await examService.deleteExam(req.params.id);
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishExam = async (req, res) => {
  try {
    const exam = await examService.updateExamStatus(req.params.id, 'published');
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const archiveExam = async (req, res) => {
  try {
    const exam = await examService.updateExamStatus(req.params.id, 'archived');
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const duplicateExam = async (req, res) => {
  try {
    const exam = await examService.duplicateExam(req.params.id, req.user.id);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignExam = async (req, res) => {
  try {
    const assignment = await examService.assignExam(req.params.id, req.body);
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const question = await examService.addQuestionToExam(req.params.id, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await examService.updateQuestion(req.params.id, req.params.questionId, req.body);
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeQuestion = async (req, res) => {
  try {
    await examService.removeQuestion(req.params.id, req.params.questionId);
    res.status(200).json({ success: true, message: 'Question removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamResults = async (req, res) => {
  try {
    const results = await examService.getExamResults(req.params.id);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExamAnalytics = async (req, res) => {
  try {
    const analytics = await examService.getExamAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
