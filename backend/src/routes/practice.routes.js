import express from 'express';
import { 
  createPracticeSheet, 
  getPracticeSheets, 
  getPracticeSheetById,
  updatePracticeSheet,
  addQuestionToSheet, 
  assignPracticeSheet,
  getQuestion,
  getCurrentPracticeSheet,
  saveCodeDraft,
  getSubmissionHistory,
  performQuestionAction,
  deletePracticeSheet
} from '../controllers/practiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('teacher', 'admin', 'superadmin', 'faculty'), createPracticeSheet);
router.get('/', protect, getPracticeSheets);
router.get('/current', protect, getCurrentPracticeSheet);
router.post('/draft', protect, saveCodeDraft);
router.post('/action', protect, performQuestionAction);
router.get('/submissions/:questionId', protect, getSubmissionHistory);
router.get('/:id', protect, getPracticeSheetById);
router.put('/:id', protect, authorize('teacher', 'admin', 'superadmin', 'faculty'), updatePracticeSheet);
router.delete('/:id', protect, authorize('teacher', 'admin', 'superadmin', 'faculty'), deletePracticeSheet);
router.post('/add-question', protect, authorize('teacher', 'admin', 'superadmin', 'faculty'), addQuestionToSheet);
router.post('/assign', protect, authorize('teacher', 'admin', 'superadmin', 'faculty'), assignPracticeSheet);
router.get('/question/:id', protect, getQuestion);

export default router;
