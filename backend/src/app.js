import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import compilerRoutes from './routes/compiler.routes.js';
import examRoutes from './routes/exam.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import violationRoutes from './routes/violation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import trainerResultsRoutes from './routes/trainerResults.routes.js';
import superadminRoutes from './routes/superadmin/index.js';
import settingsRoutes from './routes/settingsRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import practiceRoutes from './routes/practice.routes.js';
import internalProgressRoutes from './routes/internalProgress.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import hubCourseRoutes from './routes/hubCourseRoutes.js';
import { sendTestEmail } from './services/emailService.js';
import { initDelayedSyncEngine } from './services/delayedSyncEngine.js';
const app = express();

// 🚨 THE REAL VIP LIST 🚨
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://exam-proctar.vercel.app' // NO trailing slash!
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('CORS Blocked:', origin); // Prints to Render logs if someone gets blocked
      callback(new Error('CORS Policy Blocked this request'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/compiler',    compilerRoutes);
app.use('/api/exams',       examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/violations',  violationRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/trainer',     trainerResultsRoutes);
app.use('/api/superadmin',  superadminRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/metadata',    metadataRoutes);
app.use('/api/practice',    practiceRoutes);
app.use('/api/progress',    internalProgressRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/tickets',     ticketRoutes);
app.use('/api/hub-courses', hubCourseRoutes);

// ── Initialize Background Services ─────────────────────────────
initDelayedSyncEngine();

// ── Health check ──────────────────────────────────────────────
app.get('/api/test', (_req, res) => {
  res.json({ message: 'NEXUS PROCTOR backend is live 🚀', timestamp: new Date().toISOString() });
});


// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

export default app;
