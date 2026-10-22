import express from 'express';
import { autoSaveLimiter } from '../middlewares/rateLimiter.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { startSubmission, saveAnswers, submitExam, getMySubmissions, getExamSubmissions } from '../controllers/submissionController.js';

const router = express.Router();

const staffOnly = authorize('teacher', 'faculty', 'admin', 'superadmin');

router.post('/start/:examId', protect, startSubmission);
router.put('/:id/save',      protect, autoSaveLimiter, saveAnswers);
router.put('/:id/submit',    protect, submitExam);
router.get('/my',             protect, getMySubmissions);
router.get('/exam/:examId',   protect, staffOnly, getExamSubmissions);

export default router;
