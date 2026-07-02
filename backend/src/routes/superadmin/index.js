import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

// Public route — login does NOT require JWT
router.use('/', authRoutes);

// Protected routes — require JWT + superadmin role
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);

export default router;
