import axios from 'axios';
import PlatformStrategy from './PlatformStrategy.js';

class LeetCodeStrategy extends PlatformStrategy {
  async fetchStats(username) {
    if (!username) return { totalSolved: 0 };
    
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum { difficulty count }
          }
        }
      }
    `;

    try {
      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username }
      }, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      if (response.data?.errors) {
        throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
      }

      const matchedUser = response.data?.data?.matchedUser;
      if (!matchedUser) {
        throw new Error('LeetCode username not found.');
      }

      const submissions = matchedUser.submitStats?.acSubmissionNum || [];
      const total = submissions.find(s => s.difficulty === 'All')?.count || 0;
      const easy = submissions.find(s => s.difficulty === 'Easy')?.count || 0;
      const medium = submissions.find(s => s.difficulty === 'Medium')?.count || 0;
      const hard = submissions.find(s => s.difficulty === 'Hard')?.count || 0;

      return { totalSolved: total, easy, medium, hard };
    } catch (err) {
      console.error(`LeetCode Sync Error for ${username}:`, err.message);
      return { totalSolved: 0, easy: 0, medium: 0, hard: 0 }; // Fail gracefully, don't break the piggyback
    }
  }
}

export default new LeetCodeStrategy();
