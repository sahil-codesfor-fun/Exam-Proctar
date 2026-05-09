import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { setupProctorSockets } from './sockets/proctorSocket.js';

dotenv.config();

const startServer = async () => {
  // 1. Validate ENV
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("❌ FATAL ERROR: Missing MONGO_URI or JWT_SECRET in environment variables.");
    process.exit(1);
  }

  // 2. Connect MongoDB
  await connectDB();

  // 3. Start Express server
  const PORT = process.env.PORT || 5001;
  const httpServer = createServer(app);

  // 4. Initialize Socket.IO with the REAL VIP LIST
  const allowedOrigins = [
    'http://localhost:5173',
    'https://exam-proctar.vercel.app' 
  ];

  const io = new Server(httpServer, {
    cors: { 
      origin: allowedOrigins, 
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true 
    },
  });

  setupProctorSockets(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 NEXUS PROCTOR backend running on port ${PORT}`);
    console.log(`📡 Socket.io ready for real-time proctoring`);
  });
};

startServer();
