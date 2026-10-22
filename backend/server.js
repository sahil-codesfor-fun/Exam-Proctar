// Expand libuv threadpool for high-concurrency native crypto operations
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "64";

import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { seedSuperAdmin } from './prisma/seedSuperAdmin.js';
import { setupProctorSockets } from './src/sockets/proctorSocket.js';
import { setupPracticeSockets, setPracticeIO } from './src/sockets/practiceSocket.js';
import { checkOriginAllowed } from './src/config/corsConfig.js';
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

  // 3. Initialize Socket.IO with multi-process Redis adapter support
  const ioOptions = {
    cors: { 
      origin: (origin, callback) => checkOriginAllowed(origin, callback),
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 5e6 // 5MB buffer for proctoring batch snapshots
  };

  const io = new Server(httpServer, ioOptions);



  setupProctorSockets(io);
  setupPracticeSockets(io);
  setPracticeIO(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 CODE NEXUS backend running on port ${PORT}`);
    console.log(`📡 Socket.io ready for real-time proctoring (PID: ${process.pid})`);
  });
};

startServer();