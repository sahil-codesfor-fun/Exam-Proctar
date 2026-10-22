import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import examRoutes from './examRoutes.js';
import { getCourses, getCourseById, createCourse, deleteCourse } from '../../controllers/superadmin/courseController.js';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';

const router = express.Router();

router.use('/', authRoutes);

router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/subjects', subjectRoutes);
router.use('/exams', examRoutes);

router.get('/courses', protect, superAdminOnly, getCourses);
router.get('/courses/:id', protect, superAdminOnly, getCourseById);
router.post('/courses', protect, superAdminOnly, createCourse);
router.delete('/courses/:id', protect, superAdminOnly, deleteCourse);

export default router;
