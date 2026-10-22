import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createExam, getExams, getExam, updateExam, deleteExam, updateExamStatus, getExamLiveStatus } from '../controllers/examController.js';

const router = express.Router();

const staffOnly = authorize('teacher', 'faculty', 'admin', 'superadmin');

router.post('/',            protect, staffOnly, createExam);
router.get('/',             protect, getExams);
router.get('/:id/live-status', protect, getExamLiveStatus);
router.get('/:id',          protect, getExam);
router.put('/:id',          protect, staffOnly, updateExam);
router.delete('/:id',       protect, staffOnly, deleteExam);
router.patch('/:id/status', protect, staffOnly, updateExamStatus);

export default router;
