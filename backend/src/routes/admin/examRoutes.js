import express from 'express';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
import * as examController from '../../controllers/admin/examController.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// Core CRUD
router.post('/', examController.createExam);
router.get('/', examController.getAllExams);
router.get('/:id', examController.getExamById);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Exam Actions
router.post('/:id/publish', examController.publishExam);
router.post('/:id/archive', examController.archiveExam);
router.post('/:id/duplicate', examController.duplicateExam);
router.post('/:id/assign', examController.assignExam);

// Exam Content Management
router.post('/:id/questions', examController.addQuestion);
router.put('/:id/questions/:questionId', examController.updateQuestion);
router.delete('/:id/questions/:questionId', examController.removeQuestion);

// Results & Analytics
router.get('/:id/results', examController.getExamResults);
router.get('/:id/analytics', examController.getExamAnalytics);

export default router;
