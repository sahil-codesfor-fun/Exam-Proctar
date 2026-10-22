import express from 'express';
import { protect, adminOnly, authorize } from '../middleware/authMiddleware.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

router.post('/', protect, ticketController.createTicket);
router.get('/my', protect, ticketController.getMyTickets);

router.get('/admin', protect, adminOnly, ticketController.getAllTickets);
router.patch('/admin/:id/resolve', protect, adminOnly, ticketController.resolveTicket);

const staffOnly = authorize('teacher', 'faculty', 'admin', 'superadmin');

router.get('/reschedule/:examId', protect, staffOnly, ticketController.getApprovedRescheduleRequests);
router.post('/reschedule', protect, staffOnly, ticketController.rescheduleExamForStudents);

export default router;
