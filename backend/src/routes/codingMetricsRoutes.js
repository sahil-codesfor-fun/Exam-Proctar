import express from 'express';
import { getMyCodingMetrics } from '../controllers/codingMetricsController.js';
import { protect } from '../middleware/authMiddleware.js'; // Protects route with JWT session checks

const router = express.Router();

// Fetching metrics dynamically for whoever is currently logged into the app session
router.get('/my-stats', protect, getMyCodingMetrics);

export default router;