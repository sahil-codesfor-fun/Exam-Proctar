import subjectService from '../../services/subjectService.js';

export const getSubjects = async (req, res) => {
  try {
    const result = await subjectService.getSubjects(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentSubjects = async (req, res) => {
  try {
    const result = await subjectService.getSubjects({ ...req.query, departmentId: req.params.id });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const result = await subjectService.createSubject(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const result = await subjectService.updateSubject(req.params.id, req.body, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const result = await subjectService.deleteSubject(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
