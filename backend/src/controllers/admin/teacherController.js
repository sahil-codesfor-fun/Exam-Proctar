import teacherService from '../../services/teacherService.js';

export const getTeachers = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.getTeachers(req.user.departmentId, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const provisionTeacher = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.provisionTeacher(req.body, req.user.departmentId, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherDetails = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.getTeacherDetails(req.params.id, req.user.departmentId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.updateTeacher(req.params.id, req.user.departmentId, req.body, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignSubjects = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const { subjectIds } = req.body;
    const result = await teacherService.assignSubjects(req.params.id, req.user.departmentId, subjectIds || [], req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherLoginHistory = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { logs, total } = await teacherService.getLoginHistory(req.params.id, req.user.departmentId, skip, limit);
    res.status(200).json({
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherActivity = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { activities, total } = await teacherService.getActivityTimeline(req.params.id, req.user.departmentId, skip, limit);
    res.status(200).json({
      success: true,
      data: activities,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.resetPassword(req.params.id, req.user.departmentId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.deleteTeacher(req.params.id, req.user.departmentId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const hardDeleteTeacher = async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.status(403).json({ success: false, message: 'Admin does not belong to any department' });
    }
    const result = await teacherService.hardDeleteTeacher(req.params.id, req.user.departmentId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
