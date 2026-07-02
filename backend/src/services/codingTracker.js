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
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
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
  // 🚀 Set back to Thursday 12:02 AM (02 00 * * 4) so it stops looping!
  cron.schedule('59 23 * * 3', async () => {
    console.log('🔄 [CRON] Executing Weekly LeetCode Sync Engine...');
    
    try {
      // 1. Check how many students the database has
      const students = await prisma.user.findMany({
        where: { leetcodeUsername: { not: null }, role: 'student' }
      });

      console.log(`📊 [CRON] Found ${students.length} students to sync.`);
      
      // The "Penalty Box" for failed syncs
      const failedQueue = [];

      // Helper function to update DB
      const processStudentData = async (student) => {
        const stats = await fetchLeetCodeStats(student.leetcodeUsername);
        await prisma.studentCodingMetrics.upsert({
          where: { studentId_platform: { studentId: student.id, platform: 'leetcode' } },
          update: {
            totalSolved: stats.total, easySolved: stats.easy, mediumSolved: stats.medium,
            hardSolved: stats.hard, ranking: stats.ranking, weekStartCount: stats.total,
            lastUpdated: new Date()
          },
          create: {
            studentId: student.id, platform: 'leetcode', totalSolved: stats.total,
            easySolved: stats.easy, mediumSolved: stats.medium, hardSolved: stats.hard,
            ranking: stats.ranking, weekStartCount: stats.total, monthStartCount: stats.total
          }
        });
      };

      // 2. FIRST PASS: Try everyone once
      for (const student of students) {
        try {
          await processStudentData(student);
          await sleep(3000); // Polite 3-second break
        } catch (err) {
          console.warn(`⚠️ [CRON] First attempt failed for ${student.leetcodeUsername}. Adding to retry queue.`);
          failedQueue.push(student); // Push to the back of the line
          await sleep(3000);
        }
      }

      // 3. SECOND PASS: Try the failed ones exactly one more time at the end
      if (failedQueue.length > 0) {
        console.log(`🔄 [CRON] Attempting final retry for ${failedQueue.length} failed students...`);
        
        for (const student of failedQueue) {
          try {
            await processStudentData(student);
            console.log(`✅ [CRON] Success on retry for ${student.leetcodeUsername}!`);
            await sleep(3000);
          } catch (err) {
            console.error(`❌ [CRON] Final failure for ${student.leetcodeUsername}. Skipping until next week.`, err.message);
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