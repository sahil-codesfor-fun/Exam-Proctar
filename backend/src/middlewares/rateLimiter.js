import rateLimit from 'express-rate-limit';

// Global Limiter: 100 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Auth Limiter: 10 requests per 5 minutes per IP (Stricter for brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please wait 5 minutes.' }
});

// Auto-Save Limiter: 30 requests per minute per IP (Stricter for heavy DB writes)
export const autoSaveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auto-save requests. Your data is being rate limited.' }
});

// Compiler Limiter: 15 requests per minute per IP
export const compilerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Code execution rate limit exceeded. Please wait before trying again.' }
});