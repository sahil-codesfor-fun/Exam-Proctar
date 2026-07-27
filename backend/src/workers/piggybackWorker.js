import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/prisma.js';
import codechefStrategy from '../services/platforms/codechefStrategy.js';
import leetcodeStrategy from '../services/platforms/leetcodeStrategy.js';
import hackerrankStrategy from '../services/platforms/hackerrankStrategy.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const initPiggybackWorker = () => {
  console.log('🚀 Initializing BullMQ Piggyback Worker...');

  const worker = new Worker('platformSyncQueue', async (job) => {
    const { userId } = job.data;
    console.log(`🔄 Processing Piggyback Sync for user: ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { codechefUsername: true, leetcodeUsername: true, hackerrankUsername: true }
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      let codechefTotalSolved = 0;
      if (user.codechefUsername) {
        console.log(`Scraping CodeChef for ${user.codechefUsername}...`);
        const result = await codechefStrategy.fetchStats(user.codechefUsername);
        codechefTotalSolved = result.totalSolved;
        
        console.log(`Sleeping for 5000ms to bypass Cloudflare...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      console.log(`Fetching LeetCode & HackerRank concurrently...`);
      const [leetcodeResult, hackerrankResult] = await Promise.all([
        leetcodeStrategy.fetchStats(user.leetcodeUsername),
        hackerrankStrategy.fetchStats(user.hackerrankUsername)
      ]);

      await prisma.user.update({
        where: { id: userId },
        data: {
          codechefTotalSolved,
          leetcodeTotalSolved: leetcodeResult.totalSolved,
          leetcodeEasySolved: leetcodeResult.easy || 0,
          leetcodeMediumSolved: leetcodeResult.medium || 0,
          leetcodeHardSolved: leetcodeResult.hard || 0,
          hackerrankTotalSolved: hackerrankResult.totalSolved,
          platformsLastSyncedAt: new Date()
        }
      });

      console.log(`✅ Successfully completed Piggyback Sync for user: ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Piggyback Worker failed for user ${userId}:`, error.message);
      await prisma.user.update({
        where: { id: userId },
        data: { platformsLastSyncedAt: new Date() }
      }).catch(err => console.error('Failed to update failure timestamp:', err));
      throw error;
    }
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job.id} failed with error: ${err.message}`);
  });

  return worker;
};
