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
    const metrics = await prisma.studentCodingMetrics.findMany({
      include: {
        user: {
          select: { name: true, studentId: true } // Grab the student's name and ID
        }
      },
      orderBy: { totalSolved: 'desc' } // Sort by top performers first!
    });

    // Calculate the deltas for the teacher view
    const processedData = metrics.map(m => ({
      ...m,
      thisWeek: Math.max(0, m.totalSolved - m.weekStartCount),
      thisMonth: Math.max(0, m.totalSolved - m.monthStartCount)
    }));

    res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Error fetching all metrics for teacher:', error.message);
    res.status(500).json({ success: false, message: 'Server error parsing leaderboards' });
  }
};