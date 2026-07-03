import express from 'express';
import {
  getIntegrations,
  verifyUsername,
  connectIntegration,
  disconnectIntegration,
  syncIntegration
} from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

router.get('/', getIntegrations);
router.post('/:platform/verify', verifyUsername);
router.post('/:platform/connect', connectIntegration);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/sync', syncIntegration);

export default router;
