import studentService from '../../services/studentService.js';

export const getStudents = async (req, res) => {
  try {
    const result = await studentService.getStudents(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const result = await studentService.getStudentDetails(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const result = await studentService.updateStudent(req.params.id, req.body, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudentLoginHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { logs, total } = await studentService.getLoginHistory(req.params.id, skip, limit);
    res.status(200).json({
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudentActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { activities, total } = await studentService.getActivityTimeline(req.params.id, skip, limit);
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
    const result = await studentService.resetPassword(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const result = await studentService.deleteStudent(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const hardDeleteStudent = async (req, res) => {
  try {
    const result = await studentService.hardDeleteStudent(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
