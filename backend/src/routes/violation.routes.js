import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { logViolation, getExamViolations, getMyViolations, getRestrictions } from '../controllers/violationController.js';

const router = express.Router();
const staffOnly = authorize('teacher', 'faculty', 'admin', 'superadmin');

router.post('/',                      protect, logViolation);
router.get('/exam/:examId',           protect, staffOnly, getExamViolations);
router.get('/my/:examId',             protect, getMyViolations);
router.get('/restrictions/:examId',   protect, getRestrictions);

export default router;
