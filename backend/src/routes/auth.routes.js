import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerUser, loginUser, getPublicDepartments, getFacultyProfile } from '../controllers/authController.js';
import { getDepartmentCourses } from '../controllers/metadataController.js';
import { protect, facultyOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Unrestricted signup and login for students and faculty - no rate limit blocks
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/departments', getPublicDepartments);
router.get('/departments/:id/courses', getDepartmentCourses);

router.get('/profile', protect, (req, res) => {
  res.json(req.user); 
});

router.get('/faculty/profile', protect, facultyOnly, getFacultyProfile);

export default router;