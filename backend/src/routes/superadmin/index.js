import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import subjectRoutes from './subjectRoutes.js';
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

export default router;
