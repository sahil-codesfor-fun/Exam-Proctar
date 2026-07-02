import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus
} from '../../controllers/superadmin/departmentController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/')
  .get(getDepartments)
  .post(createDepartment);

router.route('/:id')
  .put(updateDepartment);

router.route('/:id/status')
  .patch(updateDepartmentStatus);

export default router;
