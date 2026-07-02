import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getFacultyList,
  createFaculty,
  toggleFacultyStatus,
  resetFacultyPassword,
  deleteFaculty,
  testEmail
} from '../controllers/adminController.js';
import {
  getSubjects,
  getTeacherSubjects,
  assignSubjectsToTeacher
} from '../controllers/adminSubjectController.js';
import teacherRoutes from './admin/teacherRoutes.js';

const router = express.Router();

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(adminOnly);

router.post('/test-email', testEmail);

router.route('/faculty')
  .get(getFacultyList)
  .post(createFaculty);

router.route('/faculty/:id/status')
  .patch(toggleFacultyStatus);

router.route('/faculty/:id/reset-password')
  .post(resetFacultyPassword);

router.route('/faculty/:id')
  .delete(deleteFaculty);

router.get('/subjects', getSubjects);

router.route('/teachers/:teacherId/subjects')
  .get(getTeacherSubjects)
  .post(assignSubjectsToTeacher);

router.use('/teachers', teacherRoutes);

export default router;
