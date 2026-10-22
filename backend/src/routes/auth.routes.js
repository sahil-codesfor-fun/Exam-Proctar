import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerUser, loginUser, getPublicDepartments, getFacultyProfile, changePassword } from '../controllers/authController.js';
import { getDepartmentCourses } from '../controllers/metadataController.js';
import { protect, facultyOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/change-password', protect, changePassword);
router.get('/departments', getPublicDepartments);
router.get('/departments/:id/courses', getDepartmentCourses);

router.get('/profile', protect, (req, res) => {
  res.json(req.user); 
});

router.get('/faculty/profile', protect, facultyOnly, getFacultyProfile);

export default router;