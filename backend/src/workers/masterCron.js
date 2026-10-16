import cron from 'node-cron';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/prisma.js';
import { processPiggybackSync } from './piggybackWorker.js';

/**
 * Adaptive Platform Sync Queue
 * Automatically uses BullMQ if Redis is active, or an in-memory async worker queue
 * if Redis is disabled or unavailable. Zero downtime and zero crashes.
 */
class AdaptivePlatformSyncQueue {
  constructor() {
    this.inMemoryQueue = [];
    this.isProcessing = false;
    this.bullQueue = null;

    const rawRedisUrl = process.env.REDIS_URL;
    const isBullMQEnabled = process.env.ENABLE_BULLMQ === 'true' && rawRedisUrl && !rawRedisUrl.includes('localhost');

    if (isBullMQEnabled) {
      try {
        const connection = new IORedis(rawRedisUrl, {
          maxRetriesPerRequest: null,
          tls: rawRedisUrl.startsWith('rediss://') ? {} : undefined
        });
        this.bullQueue = new Queue('platformSyncQueue', { connection });
        console.log('✅ BullMQ PlatformSyncQueue initialized with Redis');
      } catch (err) {
        console.warn('⚠️ BullMQ Queue init skipped, using resilient in-memory queue:', err.message);
      }
    }
  }

  async add(name, data, options = {}) {
    // 1. Try BullMQ if available
    if (this.bullQueue) {
      try {
        return await this.bullQueue.add(name, data, options);
      } catch (err) {
        console.warn('⚠️ BullMQ add failed, routing to in-memory queue:', err.message);
      }
    }

    // 2. In-Memory Processing (Zero-Redis fallback)
    const userId = data?.userId;
    if (userId && !this.inMemoryQueue.includes(userId)) {
      this.inMemoryQueue.push(userId);
      this.processQueue();
    }

    return { id: `mem_job_${Date.now()}`, data };
  }

  async processQueue() {
    if (this.isProcessing || this.inMemoryQueue.length === 0) return;
    this.isProcessing = true;

    const nextUserId = this.inMemoryQueue.shift();

    try {
      await processPiggybackSync(nextUserId);
    } catch (err) {
      console.warn(`Background sync for ${nextUserId} logged:`, err.message);
    } finally {
      // 3-second spacing between requests to protect server & external API rate limits
      setTimeout(() => {
        this.isProcessing = false;
        this.processQueue();
      }, 3000);
    }
  }
}

export const platformSyncQueue = new AdaptivePlatformSyncQueue();

export const initMasterCron = () => {
  // Weekly Cron: Every Wednesday at 00:30 AM
  cron.schedule('30 00 * * 3', async () => {
    console.log('⏰ Starting Master Piggyback Cron Job...');
    try {
      const usersToSync = await prisma.user.findMany({
        where: {
          OR: [
            { codechefUsername: { not: null } },
            { leetcodeUsername: { not: null } },
            { hackerrankUsername: { not: null } }
          ]
        },
        orderBy: {
          platformsLastSyncedAt: 'asc'
        },
        take: 10
      });

      if (usersToSync.length === 0) {
        console.log('✅ No profiles to sync.');
        return;
      }

      console.log(`Enqueuing ${usersToSync.length} jobs to platformSyncQueue...`);

      for (const user of usersToSync) {
        await platformSyncQueue.add('syncUser', { userId: user.id });
      }

      console.log('✅ Master Cron successfully enqueued all jobs.');
    } catch (error) {
      console.error('❌ Master Cron failed:', error);
    }
  });
};
