import express from 'express';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';
import {
  getExamResultsSummary,
  getDetailedReport,
  exportCSV,
  exportExcel
} from '../controllers/trainerResultsController.js';

const router = express.Router();

// Summary table data for all submissions in an exam
router.get('/results/:examId',                protect, teacherOnly, getExamResultsSummary);

// Export routes (must come before :submissionId to avoid route conflict)
router.get('/results/:examId/export/csv',     protect, teacherOnly, exportCSV);
router.get('/results/:examId/export/excel',   protect, teacherOnly, exportExcel);

// Detailed report for a single submission (lazy-loaded on accordion expand)
router.get('/results/:examId/:submissionId',  protect, teacherOnly, getDetailedReport);

export default router;
