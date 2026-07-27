import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { uploadCourseCsv, getDepartmentCourses, getAllCourses, assignCourseToDepartment, createCourse, createModule, getModuleContent, deleteCourse, getFacultyStudentProgress } from '../controllers/hubCourseController.js';
import { protect, adminOnly, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many upload requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
});

const payloadLimiter = express.json({ limit: '10kb' });
const urlEncodedLimiter = express.urlencoded({ extended: true, limit: '10kb' });

router.post(
  '/upload-csv',
  protect,
  adminOnly,
  uploadRateLimiter,
  upload.fields([
    { name: 'articlesCsv', maxCount: 1 },
    { name: 'questionsCsv', maxCount: 1 }
  ]),
  uploadCourseCsv
);

router.get('/', protect, getDepartmentCourses);

router.get('/faculty/student-progress', protect, getFacultyStudentProgress);

router.get('/module/:moduleId', protect, getModuleContent);

router.get('/admin/all', protect, adminOnly, getAllCourses);
router.post('/admin/assign', protect, adminOnly, assignCourseToDepartment);
router.post('/admin/create-course', protect, adminOnly, createCourse);
router.post('/admin/create-module', protect, adminOnly, createModule);
router.delete('/admin/course/:courseId', protect, adminOnly, deleteCourse);

export default router;

