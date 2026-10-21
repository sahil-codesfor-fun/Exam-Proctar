import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalLimiter, compilerLimiter } from './middlewares/rateLimiter.js';

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
import ticketRoutes from './routes/ticket.routes.js';
import hubCourseRoutes from './routes/hubCourseRoutes.js';
import platformRoutes from './routes/platform.routes.js';
import { sendTestEmail } from './services/emailService.js';
import { initMasterCron } from './workers/masterCron.js';
import { initPiggybackWorker } from './workers/piggybackWorker.js';
const app = express();

app.set('trust proxy', 1);

// ── Security Headers & Force HTTPS in Production ───────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allows dynamic Monaco editor web workers & sockets
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Force HTTPS in production environments behind reverse proxies
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// ── Rate Limiters (Imported from middlewares/rateLimiter.js) ─────────────────

// 🚨 THE REAL VIP LIST 🚨
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://exam-proctar.vercel.app'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
}

// Allow local LAN IPs (192.168.*, 10.*, 172.16-31.*, localhost)
const isLanOrLocalOrigin = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || isLanOrLocalOrigin(origin)) {
      callback(null, true);
    } else {
      console.error('CORS Blocked:', origin);
      callback(new Error('CORS Policy Blocked this request'));
    }
  },
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '5mb' }));


app.use('/api/', globalLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/compiler',    compilerLimiter, compilerRoutes);
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
app.use('/api/tickets',     ticketRoutes);
app.use('/api/hub-courses', hubCourseRoutes);
app.use('/api/platforms', platformRoutes);

// ── Initialize Background Services ─────────────────────────────
initMasterCron();
initPiggybackWorker();

// ── Health check ──────────────────────────────────────────────
app.get('/api/test', (_req, res) => {
  res.json({ message: 'CODE NEXUS backend is operational', timestamp: new Date().toISOString() });
});


// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

export default app;
