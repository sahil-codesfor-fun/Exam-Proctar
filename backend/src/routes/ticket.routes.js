import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

// Student routes
router.post('/', protect, ticketController.createTicket);
router.get('/my', protect, ticketController.getMyTickets);

// Admin routes
router.get('/admin', protect, adminOnly, ticketController.getAllTickets);
router.patch('/admin/:id/resolve', protect, adminOnly, ticketController.resolveTicket);

// Reschedule routes
router.get('/reschedule/:examId', protect, ticketController.getApprovedRescheduleRequests);
router.post('/reschedule', protect, ticketController.rescheduleExamForStudents);

export default router;
