import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

router.post('/', protect, ticketController.createTicket);
router.get('/my', protect, ticketController.getMyTickets);

router.get('/admin', protect, adminOnly, ticketController.getAllTickets);
router.patch('/admin/:id/resolve', protect, adminOnly, ticketController.resolveTicket);

router.get('/reschedule/:examId', protect, ticketController.getApprovedRescheduleRequests);
router.post('/reschedule', protect, ticketController.rescheduleExamForStudents);

export default router;
