import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import compilerRoutes from './routes/compiler.routes.js';
import examRoutes from './routes/exam.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import violationRoutes from './routes/violation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { sendTestEmail } from './services/emailService.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/compiler',    compilerRoutes);
app.use('/api/exams',       examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/violations',  violationRoutes);
app.use('/api/admin',       adminRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/test', (_req, res) => {
  res.json({ message: 'NEXUS PROCTOR backend is live 🚀', timestamp: new Date().toISOString() });
});

// ── SMTP Diagnostic ───────────────────────────────────────────
app.get('/test-email', async (_req, res) => {
  try {
    const user = process.env.EMAIL_USER;
    if (!user) throw new Error("EMAIL_USER not configured in .env");
    
    await sendTestEmail(user);
    res.send("MAIL SENT");
  } catch (err) {
    console.error(err);
    res.send(err.message);
  }
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

export default app;