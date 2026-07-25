import express from 'express';
import { connectPlatform, disconnectPlatform, queueGlobalRefresh } from '../controllers/platformController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

router.post('/:platform/connect', connectPlatform);
router.delete('/:platform/disconnect', disconnectPlatform);
router.post('/refresh', queueGlobalRefresh);

export default router;
