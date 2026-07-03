import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDepartments,
  getDepartmentCourses,
  getDepartmentBatches,
  getDepartmentSections,
  getDepartmentSubjects,
  getDepartmentTeachers
} from '../controllers/metadataController.js';

const router = express.Router();

router.get('/departments', protect, getDepartments);
router.get('/departments/:id/courses', protect, getDepartmentCourses);
router.get('/departments/:id/batches', protect, getDepartmentBatches);
router.get('/departments/:id/sections', protect, getDepartmentSections);
router.get('/departments/:id/subjects', protect, getDepartmentSubjects);
router.get('/departments/:id/teachers', protect, getDepartmentTeachers);

export default router;
