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
  assignSubjectsToTeacher,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/adminSubjectController.js';
import teacherRoutes from './admin/teacherRoutes.js';
import examRoutes from './admin/examRoutes.js';
import studentRoutes from './admin/studentRoutes.js';

const router = express.Router();

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

router.route('/subjects')
  .get(getSubjects)
  .post(createSubject);

router.route('/subjects/:id')
  .put(updateSubject)
  .delete(deleteSubject);

router.route('/teachers/:teacherId/subjects')
  .get(getTeacherSubjects)
  .post(assignSubjectsToTeacher);

router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/exams', examRoutes);

export default router;
