import express from 'express';
import { verifyLeetcodeUser } from '../controllers/leetcodeController.js';

const router = express.Router();
router.get('/verify/:username', verifyLeetcodeUser);

export default router;