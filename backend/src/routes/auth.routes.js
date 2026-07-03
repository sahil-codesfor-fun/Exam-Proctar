import express from 'express';
import { registerUser, loginUser, getPublicDepartments } from '../controllers/authController.js';
import { getDepartmentCourses } from '../controllers/metadataController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Changed to /signup to match your Frontend axios call! 🚀
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/departments', getPublicDepartments);
router.get('/departments/:id/courses', getDepartmentCourses);

router.get('/profile', protect, (req, res) => {
  res.json(req.user); 
});

export default router;