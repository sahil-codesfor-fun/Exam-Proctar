import express from 'express';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
import * as studentController from '../../controllers/admin/studentController.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.route('/')
  .get(studentController.getStudents);

router.route('/:id')
  .get(studentController.getStudentDetails)
  .put(studentController.updateStudent)
  .delete(studentController.deleteStudent);

router.delete('/:id/hard', studentController.hardDeleteStudent);

router.get('/:id/activity', studentController.getStudentActivity);
router.get('/:id/login-history', studentController.getStudentLoginHistory);
router.put('/:id/reset-password', studentController.resetPassword);

export default router;
