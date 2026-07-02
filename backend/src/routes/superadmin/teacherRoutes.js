import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import * as teacherController from '../../controllers/superadmin/teacherController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/')
  .get(teacherController.getTeachers)
  .post(teacherController.provisionTeacher);

router.route('/:id')
  .get(teacherController.getTeacherDetails)
  .put(teacherController.updateTeacher)
  .delete(teacherController.deleteTeacher);

router.delete('/:id/hard', teacherController.hardDeleteTeacher);

router.post('/:id/subjects', teacherController.assignSubjects);
router.get('/:id/activity', teacherController.getTeacherActivity);
router.get('/:id/login-history', teacherController.getTeacherLoginHistory);
router.put('/:id/reset-password', teacherController.resetPassword);

export default router;
