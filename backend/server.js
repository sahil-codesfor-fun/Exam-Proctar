import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { seedSuperAdmin } from './prisma/seedSuperAdmin.js';
import { setupProctorSockets } from './src/sockets/proctorSocket.js';
import { setupPracticeSockets, setPracticeIO } from './src/sockets/practiceSocket.js';
import { sendEmail } from './src/services/emailService.js';

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const startServer = async () => {
  // 1. Validate ENV 
  if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL ERROR: Missing JWT_SECRET in environment variables.");
    process.exit(1);
  }

  // 1.5 Seed Default Super Admin
  await seedSuperAdmin();

  // 2. Start Express server
  const PORT = process.env.PORT || 5002; 
  const httpServer = createServer(app);

  // 3. Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  setupProctorSockets(io);
  setupPracticeSockets(io);
  setPracticeIO(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 NEXUS PROCTOR backend running on port ${PORT}`);
    console.log(`📡 Socket.io ready for real-time proctoring`);
  });
};

startServer();