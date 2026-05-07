import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { setupProctorSockets } from './sockets/proctorSocket.js';

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5001;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupProctorSockets(io);

httpServer.listen(PORT, () => {
  console.log(`🚀 NEXUS PROCTOR backend running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time proctoring`);
});