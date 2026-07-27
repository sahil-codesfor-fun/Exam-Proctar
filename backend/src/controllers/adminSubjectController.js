import subjectService from '../services/subjectService.js';

export const getSubjects = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    
    const result = await subjectService.getSubjects({ ...req.query, departmentId: req.user.departmentId });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const data = { ...req.body, departmentId: req.user.departmentId };
    const result = await subjectService.createSubject(data, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const subject = await subjectService.getSubjectById(req.params.id);
    if (subject.data.departmentId !== req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Subject does not belong to your department' });
    }

    const data = { ...req.body, departmentId: req.user.departmentId };
    const result = await subjectService.updateSubject(req.params.id, data, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const subject = await subjectService.getSubjectById(req.params.id);
    if (subject.data.departmentId !== req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Subject does not belong to your department' });
    }

    const result = await subjectService.deleteSubject(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherSubjects = async (req, res) => {
  try {
    const result = await subjectService.getTeacherSubjects(req.params.teacherId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignSubjectsToTeacher = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    if (!Array.isArray(subjectIds)) {
      return res.status(400).json({ success: false, message: 'subjectIds must be an array' });
    }

    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }

    const result = await subjectService.assignSubjectsToTeacher(
      req.params.teacherId,
      subjectIds,
      req.user.departmentId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
