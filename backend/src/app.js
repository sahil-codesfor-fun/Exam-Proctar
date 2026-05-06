import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js'; // 1. Import your real routes

const app = express();
app.use(cors());
app.use(express.json());

// 2. Mount your real Auth Routes
// This makes all routes inside auth.routes.js start with /api/auth
app.use('/api/auth', authRoutes); 

// 3. Keep the test route to verify the connection
app.get('/api/test', (req, res) => {
  res.json({ message: "Bro, the backend is loud and clear! 🚀" });
});

// 🛑 REMOVE the old app.post('/api/auth/login', ...) block!
// Your logic now lives in authController.js and auth.routes.js.

export default app;