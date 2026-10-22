import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

let globalIO;

export const getIO = () => {
  if (!globalIO) throw new Error('Socket.io not initialized!');
  return globalIO;
};

export const setupProctorSockets = (io) => {
  globalIO = io;
  const activeSessions = new Map();
  const lastAlertTimestamp = new Map(); // Debouncing alert floods: key = `${examId}:${studentId}:${type}`

  // ── Authentication Middleware for Socket.io ─────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
                    socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_dashboard', () => {
      if (socket.user.role === 'student') {
        socket.join('students_global');
      }
    });

    socket.on('join_exam', ({ examId }) => {
      if (!examId) return;

      const studentId = socket.user.id;
      const studentName = socket.user.name || 'Student';

      socket.join(`exam_${examId}`);
      socket.join(`student_${studentId}`);
      socket.examId = examId;
      socket.studentId = studentId;
      socket.studentName = studentName;

      if (!activeSessions.has(examId)) activeSessions.set(examId, new Map());
      const sessionMap = activeSessions.get(examId);
      sessionMap.set(studentId, { socketId: socket.id, name: studentName, joinedAt: new Date() });

      io.to(`faculty_${examId}`).emit('student_joined', {
        studentId,
        studentName,
        timestamp: new Date().toISOString(),
        activeCount: sessionMap.size,
      });
    });

    socket.on('join_monitoring', ({ examId }) => {
      if (!examId) return;

      // Staff authorization check - students cannot monitor exams
      const isStaff = ['teacher', 'faculty', 'admin', 'superadmin'].includes(socket.user.role);
      if (!isStaff) {
        socket.emit('error', { message: 'Unauthorized: Faculty access required' });
        return;
      }

      socket.join(`faculty_${examId}`);
      const sessions = activeSessions.get(examId);
      socket.emit('active_students', {
        students: sessions ? Array.from(sessions.entries()).map(([id, info]) => ({ studentId: id, ...info })) : [],
      });
    });

    const seenEventIds = new Set();

    // ── Single critical event (instant bypass) ──────────────────────────────
    socket.on('violation', (data) => {
      if (!socket.examId || !socket.studentId || !data) return;

      if (data.eventId) {
        if (seenEventIds.has(data.eventId)) return; // Discard duplicate
        if (seenEventIds.size > 500) seenEventIds.clear();
        seenEventIds.add(data.eventId);
      }

      const alertKey = `${socket.examId}:${socket.studentId}:${data.type}`;
      const now = Date.now();
      const lastSent = lastAlertTimestamp.get(alertKey) || 0;

      // Debounce single violation broadcast by 300ms per type/student
      if (now - lastSent < 300) return;
      lastAlertTimestamp.set(alertKey, now);

      io.to(`faculty_${socket.examId}`).emit('violation_alert', {
        studentId: socket.studentId,
        studentName: socket.studentName,
        type: String(data.type || 'unknown').slice(0, 50),
        severity: String(data.severity || 'medium').slice(0, 20),
        details: String(data.details || '').slice(0, 500),
        timestamp: new Date().toISOString(),
        count: Number(data.count) || 0,
      });
    });

    // ── Batched proctor events (300ms micro-buffer receiver) ─────────────────
    socket.on('proctor_batch_events', (data) => {
      if (!socket.examId || !socket.studentId || !data || !Array.isArray(data.events)) return;
      if (data.events.length === 0) return;

      const freshEvents = [];
      for (const e of data.events) {
        if (e.eventId) {
          if (seenEventIds.has(e.eventId)) continue; // Discard duplicate
          if (seenEventIds.size > 500) seenEventIds.clear();
          seenEventIds.add(e.eventId);
        }
        freshEvents.push({
          type: String(e.type || 'unknown').slice(0, 50),
          severity: String(e.severity || 'medium').slice(0, 20),
          details: String(e.details || '').slice(0, 500),
          timestamp: e.timestamp || new Date().toISOString(),
          count: Number(e.count) || 0
        });
      }

      if (freshEvents.length === 0) return;

      // Broadcast scoped directly to exam faculty room
      io.to(`faculty_${socket.examId}`).emit('proctor_batch_alert', {
        studentId: socket.studentId,
        studentName: socket.studentName,
        events: freshEvents,
        count: freshEvents.length
      });
    });

    socket.on('student_restricted', (data) => {
      if (!socket.examId) return;
      io.to(`faculty_${socket.examId}`).emit('student_restricted', {
        studentId: socket.studentId,
        studentName: socket.studentName,
        reason: String(data?.reason || 'Violations threshold reached').slice(0, 200),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('exam_auto_submitted', (data) => {
      if (!socket.examId) return;
      io.to(`faculty_${socket.examId}`).emit('student_auto_submitted', {
        studentId: socket.studentId,
        studentName: socket.studentName,
        reason: String(data?.reason || 'Auto-submitted by proctor system').slice(0, 200),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('force_submit_student', async ({ studentId, reason }) => {
      // Strictly restrict force submit to authorized faculty / admin
      const isStaff = ['teacher', 'faculty', 'admin', 'superadmin'].includes(socket.user.role);
      if (!isStaff) {
        socket.emit('error', { message: 'Unauthorized: Only faculty or admin can force submit an exam' });
        return;
      }

      if (!studentId) return;
      const cleanReason = String(reason || 'Disqualified by proctor').slice(0, 200);

      io.to(`student_${studentId}`).emit('force_submit', { 
        reason: cleanReason,
        proctorName: socket.user.name 
      });

      // Audit log the forced termination
      try {
        await prisma.activityLog.create({
          data: {
            userId: socket.user.id,
            action: 'FORCE_SUBMIT_STUDENT',
            entity: 'ExamSubmission',
            entityId: String(studentId),
            details: `Proctor ${socket.user.name} (${socket.user.email}) force-submitted student ${studentId}. Reason: ${cleanReason}`,
            status: 'success'
          }
        });
      } catch (logErr) {
        console.error('Failed to log force_submit_student action:', logErr.message);
      }
    });

    socket.on('disconnect', () => {
      if (socket.examId && socket.studentId) {
        const sessions = activeSessions.get(socket.examId);
        if (sessions) {
          sessions.delete(socket.studentId);
          io.to(`faculty_${socket.examId}`).emit('student_left', {
            studentId: socket.studentId,
            studentName: socket.studentName,
            activeCount: sessions.size,
          });

          if (sessions.size === 0) {
            activeSessions.delete(socket.examId);
          }
        }
      }
    });
  });
};