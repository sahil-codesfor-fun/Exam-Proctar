import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const setupPracticeSockets = (io) => {
  const practiceNamespace = io.of('/practice');

  practiceNamespace.use(async (socket, next) => {
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
        select: { id: true, name: true, role: true }
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

  practiceNamespace.on('connection', (socket) => {
    socket.on('join_sheet', (data) => {
      const sheetId = data?.sheetId;
      if (!sheetId) return;
      socket.join(`sheet_${sheetId}`);
    });

    socket.on('leave_sheet', (data) => {
      const sheetId = data?.sheetId;
      if (!sheetId) return;
      socket.leave(`sheet_${sheetId}`);
    });

    socket.on('disconnect', () => {
    });
  });

  return practiceNamespace;
};

let ioInstance = null;
export const setPracticeIO = (io) => { ioInstance = io.of('/practice'); };
export const getPracticeIO = () => ioInstance;
