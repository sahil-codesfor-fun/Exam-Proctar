import express from 'express';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';
import {
  getExamResultsSummary,
  getDetailedReport,
  exportCSV,
  exportExcel,
  gradeSubjectiveAnswers,
  finalizeInProgressSubmissions
} from '../controllers/trainerResultsController.js';

const router = express.Router();

router.get('/results/:examId',                protect, teacherOnly, getExamResultsSummary);
router.post('/results/:examId/finalize-in-progress', protect, teacherOnly, finalizeInProgressSubmissions);

router.get('/results/:examId/export/csv',     protect, teacherOnly, exportCSV);
router.get('/results/:examId/export/excel',   protect, teacherOnly, exportExcel);

router.get('/results/:examId/:submissionId',  protect, teacherOnly, getDetailedReport);

router.put('/results/:examId/grade/:submissionId', protect, teacherOnly, gradeSubjectiveAnswers);

export default router;

