import prisma from '../../config/prisma.js';
import ProviderRegistry from './ProviderRegistry.js';
import LeetCodeProvider from './providers/LeetCodeProvider.js';
import HackerRankProvider from './providers/HackerRankProvider.js';

// Register providers
ProviderRegistry.register('LEETCODE', LeetCodeProvider);
ProviderRegistry.register('HACKERRANK', HackerRankProvider);

class PlatformSyncService {
  /**
   * Orchestrates the synchronization process for a given integration.
   */
  async syncIntegration(integrationId) {
    const integration = await prisma.platformIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) throw new Error('Integration not found.');
    if (integration.syncStatus === 'DISCONNECTED') throw new Error('Cannot sync a disconnected integration.');

    const provider = ProviderRegistry.get(integration.platform);
    
    // Set to syncing
    await prisma.platformIntegration.update({
      where: { id: integrationId },
      data: { syncStatus: 'SYNCING' }
    });

    const startTime = Date.now();
    let syncLogStatus = 'SUCCESS';
    let errorMessage = null;
    let recordsUpdated = 0;

    try {
      const syncData = await provider.sync(integration.username);

      // Update Integration Metadata
      await prisma.platformIntegration.update({
        where: { id: integrationId },
        data: {
          globalRank: syncData.globalRank ?? integration.globalRank,
          lastSuccessfulSync: new Date(),
          syncStatus: 'CONNECTED',
          syncErrorMessage: null
        }
      });

      // Upsert Statistics
      await prisma.platformStatistics.upsert({
        where: { integrationId: integrationId },
        update: {
          problemStats: syncData.statistics.problemStats || {},
          contestStats: syncData.statistics.contestStats || {},
          languageStats: syncData.statistics.languageStats || {},
          activityStats: syncData.statistics.activityStats || {},
          lastUpdated: new Date()
        },
        create: {
          integrationId: integrationId,
          problemStats: syncData.statistics.problemStats || {},
          contestStats: syncData.statistics.contestStats || {},
          languageStats: syncData.statistics.languageStats || {},
          activityStats: syncData.statistics.activityStats || {}
        }
      });

      recordsUpdated = 1;
    } catch (err) {
      syncLogStatus = 'FAILED';
      errorMessage = err.message || 'Unknown Sync Error';

      await prisma.platformIntegration.update({
        where: { id: integrationId },
        data: {
          lastFailedSync: new Date(),
          syncStatus: 'ERROR',
          syncErrorMessage: errorMessage
        }
      });
    } finally {
      // Create Log
      await prisma.platformSyncLog.create({
        data: {
          integrationId,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          status: syncLogStatus,
          durationMs: Date.now() - startTime,
          recordsUpdated,
          errorMessage
        }
      });
    }

    if (syncLogStatus === 'FAILED') {
      throw new Error(errorMessage);
    }

    return true;
  }
}

export default new PlatformSyncService();
