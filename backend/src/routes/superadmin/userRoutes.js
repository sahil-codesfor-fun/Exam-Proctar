import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../../controllers/superadmin/userController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

export default router;
