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

    if (platformKey === 'CODECHEF') {
      updateData.codechefUsername = username;
    } else if (platformKey === 'LEETCODE') {
      updateData.leetcodeUsername = username;
    } else if (platformKey === 'HACKERRANK') {
      updateData.hackerrankUsername = username;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: updateData
    });

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

    if (isRedisConnected) {
      const isLocked = await redisClient.get(redisKey);
      if (isLocked) {
        return res.status(429).json({ 
          success: false, 
          message: 'You can only sync your profile once every 24 hours.' 
        });
      }
    }

    await platformSyncQueue.add('syncUser', { userId: studentId }, { priority: 1, jobId: `sync_${studentId}`, removeOnComplete: true });

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

export const getFacultyStudentMetrics = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    if (!departmentId) {
      return res.status(403).json({ error: 'You are not assigned to a department.' });
    }

    const students = await prisma.user.findMany({
      where: { departmentId, role: 'student' },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true,
        course: true,
        codechefUsername: true, codechefTotalSolved: true, codechefStars: true,
        leetcodeUsername: true, leetcodeTotalSolved: true,
        leetcodeEasySolved: true, leetcodeMediumSolved: true, leetcodeHardSolved: true,
        hackerrankUsername: true, hackerrankTotalSolved: true,
        codingMetrics: true
      },
      orderBy: { studentId: 'asc' }
    });

    const studentIds = students.map(s => s.id);
    const submissions = await prisma.practiceSubmission.findMany({
      where: {
        studentId: { in: studentIds },
        verdict: { in: ['accepted', 'Accepted'] }
      },
      select: { studentId: true, questionId: true },
      distinct: ['studentId', 'questionId']
    });

    const questionIds = [...new Set(submissions.map(s => s.questionId))];
    const solvedQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, difficulty: true }
    });

    const qDiffMap = {};
    solvedQuestions.forEach(q => {
      qDiffMap[q.id] = (q.difficulty || 'medium').toLowerCase();
    });

    const studentSubmissionsMap = {};
    submissions.forEach(sub => {
      if (!studentSubmissionsMap[sub.studentId]) {
         studentSubmissionsMap[sub.studentId] = { easy: 0, medium: 0, hard: 0, total: 0 };
      }
      const diff = qDiffMap[sub.questionId];
      if (diff === 'easy') studentSubmissionsMap[sub.studentId].easy++;
      else if (diff === 'medium') studentSubmissionsMap[sub.studentId].medium++;
      else if (diff === 'hard') studentSubmissionsMap[sub.studentId].hard++;
      
      studentSubmissionsMap[sub.studentId].total++;
    });

    const result = students.map(student => {
      const platforms = [];
      
      // Nexus
      const nexusData = studentSubmissionsMap[student.id] || { easy: 0, medium: 0, hard: 0, total: 0 };
      platforms.push({
        platform: 'NEXUS',
        totalSolved: nexusData.total,
        easySolved: nexusData.easy,
        mediumSolved: nexusData.medium,
        hardSolved: nexusData.hard,
        ranking: 0
      });

      // LeetCode
      if (student.leetcodeUsername) {
        platforms.push({
          platform: 'LEETCODE',
          totalSolved: student.leetcodeTotalSolved || 0,
          easySolved: student.leetcodeEasySolved || 0,
          mediumSolved: student.leetcodeMediumSolved || 0,
          hardSolved: student.leetcodeHardSolved || 0,
          ranking: 0
        });
      }

      // HackerRank
      if (student.hackerrankUsername) {
        platforms.push({
          platform: 'HACKERRANK',
          totalSolved: student.hackerrankTotalSolved || 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          ranking: 0
        });
      }

      // CodeChef
      if (student.codechefUsername) {
        platforms.push({
          platform: 'CODECHEF',
          totalSolved: student.codechefTotalSolved || 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          ranking: student.codechefStars || 0
        });
      }

      const totalSolved = platforms.reduce((acc, p) => acc + p.totalSolved, 0);

      return {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        course: student.course,
        totalSolved,
        platforms
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching faculty student metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch student metrics.' });
  }
};

export const syncAllFacultyStudents = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    if (!departmentId) {
      return res.status(403).json({ error: 'You are not assigned to a department.' });
    }

    const students = await prisma.user.findMany({
      where: { 
        departmentId, 
        role: 'student',
        OR: [
          { leetcodeUsername: { not: null } },
          { hackerrankUsername: { not: null } },
          { codechefUsername: { not: null } }
        ]
      },
      select: { id: true }
    });

    for (const student of students) {
      await platformSyncQueue.add(
        'syncUser', 
        { userId: student.id }, 
        { priority: 2, jobId: `sync_${student.id}_mass`, removeOnComplete: true }
      );
    }

    return res.status(200).json({ success: true, message: `Queued sync for ${students.length} students.` });
  } catch (error) {
    console.error('Error queuing mass platform sync:', error);
    return res.status(500).json({ error: 'Failed to queue mass sync.' });
  }
};
