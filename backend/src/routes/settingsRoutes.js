import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:module?', protect, superAdminOnly, getSettings);
router.put('/:module', protect, superAdminOnly, updateSettings);

export default router;
