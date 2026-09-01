let globalIO;

export const getIO = () => {
  if (!globalIO) throw new Error('Socket.io not initialized!');
  return globalIO;
};

export const setupProctorSockets = (io) => {
  globalIO = io;
  const activeSessions = new Map();
  const lastAlertTimestamp = new Map(); // Debouncing alert floods: key = `${examId}:${studentId}:${type}`

  io.on('connection', (socket) => {
    socket.on('join_dashboard', ({ role }) => {
      if (role === 'student') socket.join('students_global');
    });

    socket.on('join_exam', ({ examId, studentId, studentName }) => {
      if (!examId || !studentId) return;

      socket.join(`exam_${examId}`);
      socket.join(`student_${studentId}`);
      socket.examId = examId;
      socket.studentId = studentId;
      socket.studentName = studentName || 'Student';

      if (!activeSessions.has(examId)) activeSessions.set(examId, new Map());
      const sessionMap = activeSessions.get(examId);
      sessionMap.set(studentId, { socketId: socket.id, name: socket.studentName, joinedAt: new Date() });

      io.to(`faculty_${examId}`).emit('student_joined', {
        studentId,
        studentName: socket.studentName,
        timestamp: new Date().toISOString(),
        activeCount: sessionMap.size,
      });
    });

    socket.on('join_monitoring', ({ examId }) => {
      if (!examId) return;
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
        type: String(data.type || 'unknown'),
        severity: String(data.severity || 'medium'),
        details: String(data.details || ''),
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
          type: String(e.type || 'unknown'),
          severity: String(e.severity || 'medium'),
          details: String(e.details || ''),
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
        reason: data?.reason || 'Violations threshold reached',
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('exam_auto_submitted', (data) => {
      if (!socket.examId) return;
      io.to(`faculty_${socket.examId}`).emit('student_auto_submitted', {
        studentId: socket.studentId,
        studentName: socket.studentName,
        reason: data?.reason || 'Auto-submitted by proctor system',
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('force_submit_student', ({ studentId, reason }) => {
      if (!studentId) return;
      io.to(`student_${studentId}`).emit('force_submit', { reason: reason || 'Disqualified by proctor' });
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