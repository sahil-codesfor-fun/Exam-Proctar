import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { uploadCourseCsv, getDepartmentCourses, getAllCourses, assignCourseToDepartment, createCourse, createModule, getModuleContent, deleteCourse, getFacultyStudentProgress } from '../controllers/hubCourseController.js';
import { protect, adminOnly, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer memory storage configuration (since we process it as a stream)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

// Rate limiting middleware for this specific route
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  message: 'Too many upload requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
});

// Enforce strict JSON and form-data payload limits
const payloadLimiter = express.json({ limit: '10kb' });
const urlEncodedLimiter = express.urlencoded({ extended: true, limit: '10kb' });

// Route to handle bulk CSV upload for courses (articles and questions)
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

// Route for students to fetch their department courses
router.get('/', protect, getDepartmentCourses);

// Route for faculty to fetch student course progress
router.get('/faculty/student-progress', protect, getFacultyStudentProgress);

// Route for students to fetch a specific module's contents
router.get('/module/:moduleId', protect, getModuleContent);

// Admin management routes
router.get('/admin/all', protect, adminOnly, getAllCourses);
router.post('/admin/assign', protect, adminOnly, assignCourseToDepartment);
router.post('/admin/create-course', protect, adminOnly, createCourse);
router.post('/admin/create-module', protect, adminOnly, createModule);
router.delete('/admin/course/:courseId', protect, adminOnly, deleteCourse);

export default router;

