import prisma from '../config/prisma.js';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { platformSyncQueue } from '../workers/masterCron.js';
import codechefStrategy from '../services/platforms/codechefStrategy.js';
import leetcodeStrategy from '../services/platforms/leetcodeStrategy.js';
import hackerrankStrategy from '../services/platforms/hackerrankStrategy.js';

export const connectPlatform = async (req, res) => {
  try {
    const { platform } = req.params; // 'CODECHEF', 'LEETCODE', 'HACKERRANK'
    const { username } = req.body;
    const studentId = req.user.id; 

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const platformKey = platform.toUpperCase();
    const updateData = {};

    // Basic Validation - we don't block the thread with heavy scraping here.
    // We just save it, and queue a high-priority sync job.
    if (platformKey === 'CODECHEF') {
      updateData.codechefUsername = username;
    } else if (platformKey === 'LEETCODE') {
      updateData.leetcodeUsername = username;
    } else if (platformKey === 'HACKERRANK') {
      updateData.hackerrankUsername = username;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    // Save to Database
    await prisma.user.update({
      where: { id: studentId },
      data: updateData
    });

    // Queue immediate sync (BullMQ will deduplicate if jobId exists and hasn't finished)
    await platformSyncQueue.add('syncUser', { userId: studentId }, { priority: 1, jobId: `sync_${studentId}`, removeOnComplete: true });

    return res.status(200).json({
      success: true,
      message: `${platformKey} connected! Syncing data in background...`
    });

  } catch (error) {
    console.error('Error connecting platform:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while connecting platform' });
  }
};

export const disconnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const studentId = req.user.id;
    
    const platformKey = platform.toUpperCase();
    const updateData = {};

    if (platformKey === 'CODECHEF') {
      updateData.codechefUsername = null;
      updateData.codechefTotalSolved = 0;
      updateData.codechefStars = 0;
    } else if (platformKey === 'LEETCODE') {
      updateData.leetcodeUsername = null;
      updateData.leetcodeTotalSolved = 0;
    } else if (platformKey === 'HACKERRANK') {
      updateData.hackerrankUsername = null;
      updateData.hackerrankTotalSolved = 0;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }
    
    await prisma.user.update({
      where: { id: studentId },
      data: updateData
    });

    return res.status(200).json({ success: true, message: `${platformKey} disconnected successfully` });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while disconnecting' });
  }
};

export const queueGlobalRefresh = async (req, res) => {
  try {
    const studentId = req.user.id;
    const redisKey = `platform_sync:${studentId}`;

    // 1. Redis Cooldown Check
    if (isRedisConnected) {
      const isLocked = await redisClient.get(redisKey);
      if (isLocked) {
        return res.status(429).json({ 
          success: false, 
          message: 'You can only sync your profile once every 24 hours.' 
        });
      }
    }

    // 2. Add to BullMQ Queue with Priority and jobId for deduplication
    await platformSyncQueue.add('syncUser', { userId: studentId }, { priority: 1, jobId: `sync_${studentId}`, removeOnComplete: true });

    // 3. Set Redis Lock (86400 seconds = 24 hours)
    if (isRedisConnected) {
      await redisClient.setEx(redisKey, 86400, 'locked');
    }

    return res.status(200).json({
      success: true,
      message: 'Sync job queued successfully! Your profile will update shortly.'
    });
  } catch (error) {
    console.error('Error queuing platform sync:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while queuing sync' });
  }
};
