import express from 'express';
import { executeCode, judgeCode, getLanguages, getTemplates } from '../controllers/compilerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/execute',   executeCode);
router.post('/judge',     protect, judgeCode);
router.get('/languages',  getLanguages);
router.get('/templates',  getTemplates);

export default router;
