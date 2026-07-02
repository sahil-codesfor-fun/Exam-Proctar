import express from 'express';
import { getMyCodingMetrics, getAllStudentsMetrics } from '../controllers/codingMetricsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-stats', protect, getMyCodingMetrics);
// 🚀 NEW ROUTE for the Teacher Dashboard
router.get('/all', protect, getAllStudentsMetrics); 

export default router;