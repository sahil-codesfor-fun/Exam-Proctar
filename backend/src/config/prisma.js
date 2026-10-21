import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

/**
 * Resilient Database Execution Helper
 * Automatically retries queries on connection pool timeouts (P2024) and transient lock errors.
 * Critical for handling 200-300 concurrent exam submissions.
 */
export const withDbRetry = async (fn, maxRetries = 4, baseDelayMs = 300) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isTransient =
        err?.code === 'P2024' || // Connection pool timeout
        err?.code === 'P2034' || // Transaction failed due to write conflict / deadlock
        err?.message?.includes('connection pool') ||
        err?.message?.includes('ETIMEDOUT') ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('deadlock');

      if (attempt <= maxRetries && isTransient) {
        // Exponential backoff with random jitter to spread the thundering herd
        const jitter = Math.floor(Math.random() * 200);
        const delay = (baseDelayMs * Math.pow(2, attempt - 1)) + jitter;
        console.warn(`[Prisma Retry] Transient DB error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;