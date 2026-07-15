import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerUser, loginUser, getPublicDepartments, getFacultyProfile } from '../controllers/authController.js';
import { getDepartmentCourses } from '../controllers/metadataController.js';
import { protect, facultyOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Changed to /signup to match your Frontend axios call! 🚀
router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/departments', getPublicDepartments);
router.get('/departments/:id/courses', getDepartmentCourses);

router.get('/profile', protect, (req, res) => {
  res.json(req.user); 
});

router.get('/faculty/profile', protect, facultyOnly, getFacultyProfile);

export default router;