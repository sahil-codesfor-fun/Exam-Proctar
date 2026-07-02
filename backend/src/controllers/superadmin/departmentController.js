import departmentService from '../../services/departmentService.js';

export const getDepartments = async (req, res) => {
  try {
    const result = await departmentService.getDepartments(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const result = await departmentService.createDepartment(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    // Basic update logic if needed
    res.status(501).json({ success: false, message: "Not implemented yet" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'DISABLED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const result = await departmentService.updateDepartmentStatus(req.params.id, status, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
