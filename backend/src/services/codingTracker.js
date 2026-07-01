import cron from 'node-cron';
import prisma from '../config/prisma.js';
import axios from 'axios';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchLeetCodeStats = async (username) => {
  const query = `
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum { difficulty count }
        }
        profile { ranking }
      }
    }
  `;
  
  const response = await axios.post('https://leetcode.com/graphql', {
    query, variables: { username }
  }, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Nexus Proctor System)' }
  });

  const submissions = response.data?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const ranking = response.data?.data?.matchedUser?.profile?.ranking || 0;
  
  const easy = submissions.find(s => s.difficulty === 'Easy')?.count || 0;
  const medium = submissions.find(s => s.difficulty === 'Medium')?.count || 0;
  const hard = submissions.find(s => s.difficulty === 'Hard')?.count || 0;
  const total = submissions.find(s => s.difficulty === 'All')?.count || 0;

  return { total, easy, medium, hard, ranking };
};

export const startCodingTracker = () => {
  // Runs every Sunday at 03:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('🔄 [CRON] Starting Throttled LeetCode Sync...');
    
    try {
      const students = await prisma.user.findMany({
        where: { leetcodeUsername: { not: null }, role: 'student' }
      });

      for (const student of students) {
        try {
          const stats = await fetchLeetCodeStats(student.leetcodeUsername);
          
          await prisma.studentCodingMetrics.upsert({
            where: {
              studentId_platform: {
                studentId: student.id,
                platform: 'leetcode'
              }
            },
            update: {
              totalSolved: stats.total,
              easySolved: stats.easy,
              mediumSolved: stats.medium,
              hardSolved: stats.hard,
              ranking: stats.ranking,
              lastUpdated: new Date()
            },
            create: {
              studentId: student.id,
              platform: 'leetcode',
              totalSolved: stats.total,
              easySolved: stats.easy,
              mediumSolved: stats.medium,
              hardSolved: stats.hard,
              ranking: stats.ranking
            }
          });

          // Wait 3 seconds before next student
          await sleep(3000);

        } catch (err) {
          console.error(`❌ Failed to sync ${student.leetcodeUsername}:`, err.message);
          await sleep(3000);
        }
      }
      
      console.log('✅ [CRON] LeetCode Sync Complete!');
    } catch (error) {
      console.error('❌ [CRON] Critical Failure in Tracking Engine:', error);
    }
  });
};