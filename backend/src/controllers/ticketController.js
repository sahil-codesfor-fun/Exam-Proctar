import prisma from '../config/prisma.js';

export const createTicket = async (req, res) => {
  try {
    const { examId, reason } = req.body;
    
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    
    const existingSubmission = await prisma.submission.findFirst({
      where: { examId, studentId: req.user.id }
    });
    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'You have already attempted this exam and cannot appeal.' });
    }
    
    const existingTickets = await prisma.missedExamTicket.findMany({
      where: {
        examId,
        studentId: req.user.id
      },
      orderBy: { createdAt: 'desc' }
    });
    
    let appealNumber = 1;

    if (existingTickets.length > 0) {
      if (existingTickets.length >= 2) {
        return res.status(400).json({ success: false, message: 'You have reached the maximum number of appeals for this exam.' });
      }

      const lastTicket = existingTickets[0];

      if (lastTicket.status === 'pending') {
        return res.status(400).json({ success: false, message: 'You already have a pending appeal for this exam.' });
      }

      if (lastTicket.status === 'rejected') {
        return res.status(400).json({ success: false, message: 'Your previous appeal was rejected. You cannot appeal again.' });
      }

      if (!lastTicket.isRescheduled || !lastTicket.rescheduledEndTime) {
        return res.status(400).json({ success: false, message: 'Your previous appeal is approved but not rescheduled yet.' });
      }

      const now = new Date();
      if (now <= new Date(lastTicket.rescheduledEndTime)) {
        return res.status(400).json({ success: false, message: 'The rescheduled exam window has not expired yet.' });
      }

      appealNumber = 2;
    }
    
    const ticket = await prisma.missedExamTicket.create({
      data: {
        examId,
        studentId: req.user.id,
        reason,
        appealNumber
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

export const getAllTickets = async (req, res) => {
  try {
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
    const { status } = req.body;
    
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
    
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
