import cron from 'node-cron';
import prisma from '../config/prisma.js';
import PlatformSyncService from './sync/PlatformSyncService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const startCodingTracker = () => {
  // Run every 12 hours (e.g., at midnight and noon)
  cron.schedule('59 23 * * 3', async () => {
    console.log('🔄 [CRON] Executing Platform Sync Engine (12-hour cycle)...');

    try {
      const integrations = await prisma.platformIntegration.findMany({
        where: { syncStatus: { not: 'DISCONNECTED' } }
      });

      console.log(`📊 [CRON] Found ${integrations.length} integrations to sync.`);

      const failedQueue = [];

      for (const integration of integrations) {
        try {
          await PlatformSyncService.syncIntegration(integration.id);
          await sleep(3000); // Polite 3-second break
        } catch (err) {
          console.warn(`⚠️ [CRON] First attempt failed for integration ${integration.id}. Adding to retry queue.`);
          failedQueue.push(integration); 
          await sleep(3000);
        }
      }

      if (failedQueue.length > 0) {
        console.log(`🔄 [CRON] Attempting final retry for ${failedQueue.length} failed integrations...`);

        for (const integration of failedQueue) {
          try {
            await PlatformSyncService.syncIntegration(integration.id);
            console.log(`✅ [CRON] Success on retry for ${integration.id}!`);
            await sleep(3000);
          } catch (err) {
            console.error(`❌ [CRON] Final failure for ${integration.id}. Skipping until next cycle.`, err.message);
            await sleep(3000);
          }
        }
      }

      console.log('✅ [CRON] Finished Syncing All Active Profiles!');
    } catch (error) {
      console.error('❌ [CRON] Fatal runtime error inside sync engine:', error);
    }
  });
};