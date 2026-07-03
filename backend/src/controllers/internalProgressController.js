import prisma from '../config/prisma.js';

// ----------------------------------------------------
// GET UNIFIED DASHBOARD
// ----------------------------------------------------
export const getUnifiedDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get basic stats
    const progress = await prisma.studentCodingProgress.findUnique({ where: { studentId } }) || {
      totalAssigned: 0, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0
    };
    
    const stats = await prisma.studentCodingStatistics.findUnique({ where: { studentId } }) || {
      currentStreak: 0, longestStreak: 0, acceptanceRate: 0, averageRuntime: 0, averageMemory: 0, totalAttempts: 0, wrongAttempts: 0, solvedOnFirstAttempt: 0
    };

    // Topic progress
    const topicProgress = await prisma.topicProgress.findMany({ where: { studentId } });

    // Badges
    const badges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true }
    });

    res.status(200).json({
      success: true,
      data: {
        progress,
        stats,
        topicProgress,
        badges
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET INTERNAL LEADERBOARD
// ----------------------------------------------------
export const getInternalLeaderboard = async (req, res) => {
  try {
    const { type } = req.query; // 'university', 'department', 'course', etc.

    const leaderboard = await prisma.codingLeaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        // Need to join user to get name/department depending on how schema relations are setup
        // For now just sending raw rows since User relation is not explicitly on Leaderboard in schema,
        // Wait, schema has studentId on CodingLeaderboard but no explicit relation defined.
        // Let's assume we can fetch users separately or add relation.
      }
    });

    // Fetch user details for these studentIds
    const studentIds = leaderboard.map(l => l.studentId);
    const users = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, departmentId: true }
    });

    const enrichedLeaderboard = leaderboard.map(l => ({
      ...l,
      user: users.find(u => u.id === l.studentId)
    }));

    res.status(200).json({ success: true, leaderboard: enrichedLeaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
