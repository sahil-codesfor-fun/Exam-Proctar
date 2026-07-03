import express from 'express';
import { protect, superAdminOnly } from '../../middleware/authMiddleware.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
  getAllocatedCourses,
  allocateCourses,
  updateAllocatedCourse,
  removeAllocatedCourse
} from '../../controllers/superadmin/departmentController.js';
import {
  getDepartmentSubjects,
  createSubject
} from '../../controllers/superadmin/subjectController.js';

const router = express.Router();

router.use(protect, superAdminOnly);

router.route('/')
  .get(getDepartments)
  .post(createDepartment);

router.route('/:id')
  .put(updateDepartment)
  .delete(deleteDepartment);

router.route('/:id/status')
  .patch(updateDepartmentStatus);

router.route('/:id/subjects')
  .get(getDepartmentSubjects)
  .post((req, res, next) => {
    req.body.departmentId = req.params.id;
    next();
  }, createSubject);

router.route('/:id/courses')
  .get(getAllocatedCourses)
  .post(allocateCourses);

router.route('/:id/courses/:courseId')
  .put(updateAllocatedCourse)
  .delete(removeAllocatedCourse);

export default router;
