import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { processPiggybackSync } from './piggybackWorker.js';

/**
 * In-Memory Platform Sync Queue
 * Manages background student platform syncing with zero-Redis infrastructure.
 */
class InMemoryPlatformSyncQueue {
  constructor() {
    this.inMemoryQueue = [];
    this.isProcessing = false;
  }

  async add(_name, data) {
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

export const platformSyncQueue = new InMemoryPlatformSyncQueue();

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
