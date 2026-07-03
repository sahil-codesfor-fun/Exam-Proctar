import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import examRoutes from './examRoutes.js';
import { getCourses, getCourseById, createCourse, deleteCourse } from '../../controllers/superadmin/courseController.js';
import prisma from '../../config/prisma.js';

const router = express.Router();

// Public route — login does NOT require JWT
router.use('/', authRoutes);

// Protected routes — require JWT + superadmin role
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/subjects', subjectRoutes);
router.use('/exams', examRoutes);

// Course Management
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.post('/courses', createCourse);
router.delete('/courses/:id', deleteCourse);

export default router;
