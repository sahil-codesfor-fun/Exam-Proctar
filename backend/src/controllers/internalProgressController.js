import prisma from '../config/prisma.js';

// ----------------------------------------------------
// GET UNIFIED DASHBOARD
// ----------------------------------------------------
export const getUnifiedDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const user = await prisma.user.findUnique({ 
      where: { id: studentId },
      select: { 
        codechefUsername: true, codechefTotalSolved: true, codechefStars: true,
        leetcodeUsername: true, leetcodeTotalSolved: true,
        leetcodeEasySolved: true, leetcodeMediumSolved: true, leetcodeHardSolved: true,
        hackerrankUsername: true, hackerrankTotalSolved: true,
        platformsLastSyncedAt: true
      }
    });

    const progress = await prisma.studentCodingProgress.findUnique({ where: { studentId } }) || {
      totalAssigned: 0, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0
    };
    
    const stats = await prisma.studentCodingStatistics.findUnique({ where: { studentId } }) || {
      currentStreak: 0, longestStreak: 0, acceptanceRate: 0, averageRuntime: 0, averageMemory: 0, totalAttempts: 0, wrongAttempts: 0, solvedOnFirstAttempt: 0
    };

    const topicProgress = await prisma.topicProgress.findMany({ where: { studentId } });

    const badges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true }
    });

    // 🚀 THE NEW ENGINE: Fetch submissions to build the activityMap for the heatmap!
    const submissions = await prisma.submission.findMany({
      where: { 
        studentId: studentId,
        status: { in: ['submitted', 'auto_submitted'] }
      },
      select: { createdAt: true }
    });

    const practiceSubmissionsHeat = await prisma.practiceSubmission.findMany({
      where: { studentId: studentId },
      select: { createdAt: true }
    });

    const activityMap = {};
    const allActivity = [...submissions, ...practiceSubmissionsHeat];
    
    allActivity.forEach(sub => {
      if (sub.createdAt) {
        const dateStr = new Date(sub.createdAt).toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });

    let computedStreak = 0;
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];
    todayObj.setUTCDate(todayObj.getUTCDate() - 1);
    const yesterdayStr = todayObj.toISOString().split('T')[0];
    
    let streakDate = new Date(); 
    
    if (activityMap[todayStr]) {
      computedStreak = 1;
      streakDate.setUTCDate(streakDate.getUTCDate() - 1);
    } else if (activityMap[yesterdayStr]) {
      computedStreak = 1;
      streakDate.setUTCDate(streakDate.getUTCDate() - 2);
    }
    
    if (computedStreak > 0) {
      while(true) {
        const sStr = streakDate.toISOString().split('T')[0];
        if (activityMap[sStr]) {
          computedStreak++;
          streakDate.setUTCDate(streakDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }
    
    if (stats) {
      stats.currentStreak = computedStreak;
    }

    // 🚀 NEW: SINGLE SOURCE OF TRUTH FOR NEXUS SOLVED
    const acceptedSubmissions = await prisma.practiceSubmission.findMany({
      where: {
        studentId: studentId,
        verdict: { in: ['accepted', 'Accepted'] }
      },
      select: { questionId: true },
      distinct: ['questionId']
    });

    const questionIds = acceptedSubmissions.map(s => s.questionId);

    const solvedQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { difficulty: true }
    });

    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    solvedQuestions.forEach(q => {
      const diff = (q.difficulty || '').toLowerCase();
      if (diff === 'easy') easySolved++;
      else if (diff === 'medium') mediumSolved++;
      else if (diff === 'hard') hardSolved++;
    });

    const nexusSolvedCount = solvedQuestions.length;

    progress.totalSolved = nexusSolvedCount;
    progress.easySolved = easySolved;
    progress.mediumSolved = mediumSolved;
    progress.hardSolved = hardSolved;

    res.status(200).json({
      success: true,
      data: {
        user,
        progress,
        stats,
        topicProgress,
        badges,
        activityMap,
        nexusSolvedCount
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
    const { type } = req.query;

    const leaderboard = await prisma.codingLeaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: {
      }
    });

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