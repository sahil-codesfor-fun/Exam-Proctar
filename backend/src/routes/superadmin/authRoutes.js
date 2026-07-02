import express from 'express';
import { superAdminLogin } from '../../controllers/superadmin/authController.js';

const router = express.Router();

// POST /api/superadmin/login — no auth required
router.post('/login', superAdminLogin);

export default router;
