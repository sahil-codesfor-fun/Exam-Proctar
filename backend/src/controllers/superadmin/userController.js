import userService from '../../services/userService.js';

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    if (role === 'admin' || role === 'department_head') {
      const result = await userService.getDepartmentHeads(req.query);
      return res.status(200).json(result);
    }

    res.status(501).json({ success: false, message: "Use getDepartmentHeads for admins. Other roles not fully migrated yet." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (role === 'admin' || role === 'department_head') {
      const result = await userService.provisionDepartmentHead(req.body, req.user.id);
      return res.status(201).json(result);
    }

    res.status(400).json({ success: false, message: 'Invalid role for provisioning through this endpoint.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    res.status(501).json({ success: false, message: "Not implemented in phase 1" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteDepartmentHead(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
