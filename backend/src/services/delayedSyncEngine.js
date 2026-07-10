import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

export const initDelayedSyncEngine = () => {
  console.log('🚀 Delayed Sync Engine Initialized');

  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏳ Running Delayed Sync Engine for external sources...');
    try {
      // 1. Fetch PENDING sync jobs from SyncQueue
      const pendingSyncs = await prisma.syncQueue.findMany({
        where: { status: 'PENDING' },
        take: 50, // Batch limit to prevent overloading external APIs
      });

      if (pendingSyncs.length === 0) {
        console.log('✅ No pending syncs found.');
        return;
      }

      console.log(`Processing ${pendingSyncs.length} pending syncs...`);

      // 2. Process each sync job
      for (const sync of pendingSyncs) {
        try {
          // Dummy logic: We assume the verification with external API (e.g. LeetCode) happened here.
          // In a real scenario, you would fetch external data based on `sync.source` and `sync.studentId`
          
          const isVerified = true; // Placeholder for actual verification
          
          if (isVerified) {
            // Find or create StudentCodingProgress
            let progress = await prisma.studentCodingProgress.findUnique({
              where: { studentId: sync.studentId }
            });

            if (!progress) {
              progress = await prisma.studentCodingProgress.create({
                data: {
                  studentId: sync.studentId,
                  totalAssigned: 0,
                  totalSolved: 1,
                  easySolved: 1, // You might want to get complexity from Question
                }
              });
            } else {
              await prisma.studentCodingProgress.update({
                where: { studentId: sync.studentId },
                data: {
                  totalSolved: { increment: 1 }
                }
              });
            }

            // Update SyncQueue status
            await prisma.syncQueue.update({
              where: { id: sync.id },
              data: { status: 'PROCESSED' }
            });
            console.log(`✅ Synced progress for student: ${sync.studentId}`);
          }
        } catch (jobError) {
          console.error(`❌ Error processing sync job ${sync.id}:`, jobError);
          // Update SyncQueue status to ERROR
          await prisma.syncQueue.update({
            where: { id: sync.id },
            data: { status: 'ERROR' }
          });
        }
      }
    } catch (error) {
      console.error('❌ Delayed Sync Engine Error:', error);
    }
  });
};
