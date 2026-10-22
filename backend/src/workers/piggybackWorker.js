import prisma, { withDbRetry } from '../config/prisma.js';
import codechefStrategy from '../services/platforms/codechefStrategy.js';
import leetcodeStrategy from '../services/platforms/leetcodeStrategy.js';
import hackerrankStrategy from '../services/platforms/hackerrankStrategy.js';

/**
 * Core Piggyback Sync Processor
 * Syncs LeetCode, CodeChef, and HackerRank metrics for a student.
 * Can be called by BullMQ OR directly by our In-Memory Queue without Redis.
 */
export const processPiggybackSync = async (userId) => {
  console.log(`🔄 Processing Piggyback Sync for user: ${userId}`);

  try {
    const user = await withDbRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { codechefUsername: true, leetcodeUsername: true, hackerrankUsername: true }
      });
    }, 2, 600);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    let codechefTotalSolved = 0;
    if (user.codechefUsername) {
      console.log(`Scraping CodeChef for ${user.codechefUsername}...`);
      try {
        const result = await codechefStrategy.fetchStats(user.codechefUsername);
        codechefTotalSolved = result?.totalSolved || 0;
      } catch (ccErr) {
        console.warn(`CodeChef sync skipped for ${user.codechefUsername}:`, ccErr.message);
      }
      // Safety delay to prevent Cloudflare / rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Fetching LeetCode & HackerRank for user ${userId}...`);
    const [leetcodeResult, hackerrankResult] = await Promise.all([
      user.leetcodeUsername
        ? leetcodeStrategy.fetchStats(user.leetcodeUsername).catch(err => {
            console.warn(`LeetCode sync failed for ${user.leetcodeUsername}:`, err.message);
            return { totalSolved: 0, easy: 0, medium: 0, hard: 0 };
          })
        : Promise.resolve({ totalSolved: 0, easy: 0, medium: 0, hard: 0 }),
      user.hackerrankUsername
        ? hackerrankStrategy.fetchStats(user.hackerrankUsername).catch(err => {
            console.warn(`HackerRank sync failed for ${user.hackerrankUsername}:`, err.message);
            return { totalSolved: 0 };
          })
        : Promise.resolve({ totalSolved: 0 })
    ]);

    await prisma.user.update({
      where: { id: userId },
      data: {
        codechefTotalSolved,
        leetcodeTotalSolved: leetcodeResult?.totalSolved || 0,
        leetcodeEasySolved: leetcodeResult?.easy || 0,
        leetcodeMediumSolved: leetcodeResult?.medium || 0,
        leetcodeHardSolved: leetcodeResult?.hard || 0,
        hackerrankTotalSolved: hackerrankResult?.totalSolved || 0,
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
};

export const initPiggybackWorker = () => {
  return null;
};
