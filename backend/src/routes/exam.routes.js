import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createExam, getExams, getExam, updateExam, deleteExam, updateExamStatus, getExamLiveStatus } from '../controllers/examController.js';

const router = express.Router();

router.post('/',            protect, createExam);
router.get('/',             protect, getExams);
router.get('/:id/live-status', protect, getExamLiveStatus);
router.get('/:id',          protect, getExam);
router.put('/:id',          protect, updateExam);
router.delete('/:id',       protect, deleteExam);
router.patch('/:id/status', protect, updateExamStatus);

export default router;
