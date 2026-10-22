// Strict allowlist for frontend origins
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://exam-proctar.vercel.app'
];

if (process.env.FRONTEND_URL) {
  defaultOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
}

if (process.env.ALLOWED_ORIGINS) {
  const extra = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  defaultOrigins.push(...extra);
}

export const isLanOrLocalOrigin = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
};

export const checkOriginAllowed = (origin, callback) => {
  // Allow non-browser requests (server-to-server, curl)
  if (!origin) {
    if (callback) return callback(null, true);
    return true;
  }

  // Check explicit allowlist
  if (defaultOrigins.includes(origin)) {
    if (callback) return callback(null, true);
    return true;
  }

  // In development/staging or LAN testing, allow local private networks
  if (process.env.NODE_ENV !== 'production' && isLanOrLocalOrigin(origin)) {
    if (callback) return callback(null, true);
    return true;
  }

  if (callback) {
    return callback(new Error('CORS Policy: Access denied for origin ' + origin));
  }
  return false;
};

export const corsOptions = {
  origin: checkOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
