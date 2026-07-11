import prisma from '../config/prisma.js';

export const createTicket = async (req, res) => {
  try {
    const { examId, reason } = req.body;
    
    // Check if the exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    
    // Check if a ticket already exists for this exam and student
    const existingTicket = await prisma.missedExamTicket.findFirst({
      where: {
        examId,
        studentId: req.user.id
      }
    });
    
    if (existingTicket) {
      return res.status(400).json({ success: false, message: 'You have already submitted a ticket for this exam' });
    }
    
    // Create the ticket
    const ticket = await prisma.missedExamTicket.create({
      data: {
        examId,
        studentId: req.user.id,
        reason
      }
    });
    
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await prisma.missedExamTicket.findMany({
      where: { studentId: req.user.id },
      include: {
        exam: { select: { title: true, examCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Routes
export const getAllTickets = async (req, res) => {
  try {
    // If admin is department scoped, we might want to filter by department.
    // For now, let's return tickets for exams created by this admin, or their department
    const query = {};
    if (req.user.role === 'admin' && req.user.departmentId) {
       query.exam = { departmentId: req.user.departmentId };
    }
    
    const tickets = await prisma.missedExamTicket.findMany({
      where: query,
      include: {
        student: { select: { name: true, email: true, studentId: true } },
        exam: { select: { title: true, examCode: true } },
        resolver: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await prisma.missedExamTicket.update({
      where: { id },
      data: {
        status,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      }
    });
    
    // If approved, we might need to reset their submission, or allow them to take it again.
    // That can be handled later or directly here by deleting their previous attempts if any.
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reschedule logic
export const getApprovedRescheduleRequests = async (req, res) => {
  try {
    const { examId } = req.params;
    const tickets = await prisma.missedExamTicket.findMany({
      where: {
        examId,
        status: 'approved'
      },
      include: {
        student: { select: { name: true, email: true, studentId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rescheduleExamForStudents = async (req, res) => {
  try {
    const { ticketIds, newStartTime, newEndTime } = req.body;

    if (!ticketIds || !newStartTime || !newEndTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const updatedTickets = await prisma.missedExamTicket.updateMany({
      where: {
        id: { in: ticketIds },
        status: 'approved'
      },
      data: {
        isRescheduled: true,
        rescheduledStartTime: new Date(newStartTime),
        rescheduledEndTime: new Date(newEndTime)
      }
    });

    res.json({ success: true, message: `Rescheduled exam for ${updatedTickets.count} students.`, count: updatedTickets.count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
