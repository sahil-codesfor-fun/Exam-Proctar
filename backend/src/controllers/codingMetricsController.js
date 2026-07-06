import prisma from '../config/prisma.js';

export const getMyCodingMetrics = async (req, res) => {
  try {
    // Find metrics mapped directly to the logged-in student's token ID
    const metrics = await prisma.studentCodingMetrics.findFirst({
      where: {
        studentId: req.user.id,
        platform: 'leetcode'
      }
    });

    // If the background cron job hasn't run yet for this new user, return zeroed placeholders
    if (!metrics) {
      return res.json({
        success: true,
        data: {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          ranking: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      });
    }

    // Mathematical formula calculation for deltas: Current Total - Historical Starting Points
    const calculatedData = {
      totalSolved: metrics.totalSolved,
      easySolved: metrics.easySolved,
      mediumSolved: metrics.mediumSolved,
      hardSolved: metrics.hardSolved,
      ranking: metrics.ranking,
      thisWeek: Math.max(0, metrics.totalSolved - metrics.weekStartCount),
      thisMonth: Math.max(0, metrics.totalSolved - metrics.monthStartCount),
      lastUpdated: metrics.lastUpdated
    };

    res.json({
      success: true,
      data: calculatedData
    });
  } catch (error) {
    console.error('Error fetching student metrics:', error.message);
    res.status(500).json({ success: false, message: 'Server error parsing coding metrics' });
  }
};

export const getAllStudentsMetrics = async (req, res) => {
  try {
    // 1. Fetch External Integrations (LeetCode, HackerRank)
    const externalIntegrations = await prisma.platformIntegration.findMany({
      where: { syncStatus: { not: 'DISCONNECTED' } },
      include: {
        user: { select: { name: true, studentId: true } },
        statistics: true
      }
    });

    // 2. Fetch Internal Nexus Playground Metrics
    const internalMetrics = await prisma.studentCodingMetrics.findMany({
      include: {
        user: { select: { name: true, studentId: true } }
      }
    });

    // 3. Process External Data
    const processedExternal = externalIntegrations.map(m => {
      const stats = m.statistics || {};
      const total = stats.problemStats?.total || stats.activityStats?.stars || 0;
      
      return {
        id: `ext-${m.id}`,
        user: m.user,
        platform: m.platform ? m.platform.toUpperCase() : 'UNKNOWN',
        totalSolved: total,
        easySolved: stats.problemStats?.easy || 0,
        mediumSolved: stats.problemStats?.medium || 0,
        hardSolved: stats.problemStats?.hard || 0,
        ranking: stats.globalRank || 0,
        thisWeek: 0, 
        thisMonth: 0 
      };
    });

    // 4. Process Internal Data (Nexus Playground)
    const processedInternal = internalMetrics.map(m => {
      return {
        id: `int-${m.id}`,
        user: m.user,
        platform: 'NEXUS', 
        totalSolved: m.totalSolved || 0,
        easySolved: m.easySolved || 0,
        mediumSolved: m.mediumSolved || 0,
        hardSolved: m.hardSolved || 0,
        ranking: m.ranking || 0,
        thisWeek: Math.max(0, (m.totalSolved || 0) - (m.weekStartCount || 0)),
        thisMonth: Math.max(0, (m.totalSolved || 0) - (m.monthStartCount || 0))
      };
    });

    // 5. Combine and Sort by Total Solved descending
    const combinedData = [...processedExternal, ...processedInternal].sort((a, b) => b.totalSolved - a.totalSolved);

    res.json({ success: true, data: combinedData });
  } catch (error) {
    console.error('❌ Error fetching teacher metrics:', error);
    res.status(500).json({ success: false, message: 'Server error fetching all metrics' });
  }
};