import express from 'express';
import { connectPlatform, disconnectPlatform, queueGlobalRefresh, getFacultyStudentMetrics } from '../controllers/platformController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/:platform/connect', connectPlatform);
router.delete('/:platform/disconnect', disconnectPlatform);
router.post('/refresh', queueGlobalRefresh);
router.get('/faculty/student-metrics', getFacultyStudentMetrics);

export default router;
