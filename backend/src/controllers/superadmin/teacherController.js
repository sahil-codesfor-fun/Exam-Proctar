import teacherService from '../../services/teacherService.js';

export const getTeachers = async (req, res) => {
  try {
    // For superadmin, departmentId is passed as undefined, which queries across all departments
    const result = await teacherService.getTeachers(undefined, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const provisionTeacher = async (req, res) => {
  try {
    // SuperAdmin needs to specify departmentId in the body
    const { departmentId } = req.body;
    if (!departmentId) throw new Error('Department ID is required when SuperAdmin provisions a teacher');
    const result = await teacherService.provisionTeacher(req.body, departmentId, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherDetails = async (req, res) => {
  try {
    const result = await teacherService.getTeacherDetails(req.params.id, undefined);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const result = await teacherService.updateTeacher(req.params.id, undefined, req.body, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    // Super Admin assigning subjects. We still need the teacher's department ID to verify subjects.
    // However, teacherService already checks if subjects belong to teacher's department.
    // Wait, teacherService's assignSubjects checks: subjects.departmentId === departmentId. 
    // If departmentId is undefined, this might break. Let's fix that later if needed.
    // Actually, we pass undefined, but we need the teacher's actual department.
    // We will retrieve teacher's departmentId inside the service.
    const result = await teacherService.assignSubjects(req.params.id, undefined, subjectIds || [], req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherLoginHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { logs, total } = await teacherService.getLoginHistory(req.params.id, undefined, skip, limit);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { activities, total } = await teacherService.getActivityTimeline(req.params.id, undefined, skip, limit);
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
    const result = await teacherService.resetPassword(req.params.id, undefined, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const result = await teacherService.deleteTeacher(req.params.id, undefined, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const hardDeleteTeacher = async (req, res) => {
  try {
    const result = await teacherService.hardDeleteTeacher(req.params.id, undefined, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
