import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from '../../controllers/superadmin/subjectController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/')
  .get(getSubjects)
  .post(createSubject);

router.route('/:id')
  .put(updateSubject)
  .delete(deleteSubject);

export default router;
