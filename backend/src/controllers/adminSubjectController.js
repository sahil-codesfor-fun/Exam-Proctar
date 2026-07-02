import subjectService from '../services/subjectService.js';

export const getSubjects = async (req, res) => {
  try {
    // Admin can ONLY see subjects belonging to their own department
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    
    // Inject departmentId from JWT
    const result = await subjectService.getSubjects({ ...req.query, departmentId: req.user.departmentId });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherSubjects = async (req, res) => {
  try {
    // Basic authorization could be applied here to ensure teacher belongs to admin's dept
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
