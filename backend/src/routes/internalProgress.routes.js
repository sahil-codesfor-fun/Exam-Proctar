import express from 'express';
import { getUnifiedDashboard, getInternalLeaderboard } from '../controllers/internalProgressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getUnifiedDashboard);
router.get('/leaderboard', protect, getInternalLeaderboard);

export default router;
