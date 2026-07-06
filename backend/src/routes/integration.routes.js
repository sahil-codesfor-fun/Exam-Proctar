import express from 'express';
import {
  getIntegrations,
  verifyUsername,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  syncAllIntegrations // 🌮 Imported the new function!
} from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

router.get('/', getIntegrations);

// 🚀 NUEVO: Universal Sync Route! (Must be ABOVE the :platform routes!)
router.post('/sync-all', syncAllIntegrations);

router.post('/:platform/verify', verifyUsername);
router.post('/:platform/connect', connectIntegration);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/sync', syncIntegration);

export default router;