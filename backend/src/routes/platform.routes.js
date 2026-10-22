import express from 'express';
import { connectPlatform, disconnectPlatform, queueGlobalRefresh, getFacultyStudentMetrics, syncAllFacultyStudents } from '../controllers/platformController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/:platform/connect', connectPlatform);
router.delete('/:platform/disconnect', disconnectPlatform);
router.post('/refresh', queueGlobalRefresh);
router.get('/faculty/student-metrics', teacherOnly, getFacultyStudentMetrics);
router.post('/faculty/sync-all', teacherOnly, syncAllFacultyStudents);

export default router;
