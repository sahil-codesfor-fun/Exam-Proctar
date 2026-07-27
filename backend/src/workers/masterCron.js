import cron from 'node-cron';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/prisma.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const platformSyncQueue = new Queue('platformSyncQueue', { connection });

export const initMasterCron = () => {
  cron.schedule('30 00 * * 3 ', async () => {
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
