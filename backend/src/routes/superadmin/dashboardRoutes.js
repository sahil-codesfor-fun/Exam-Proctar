import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import { getDashboardStats, getDashboardActivity } from '../../controllers/superadmin/dashboardController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/stats').get(getDashboardStats);
router.route('/activity').get(getDashboardActivity);

export default router;
