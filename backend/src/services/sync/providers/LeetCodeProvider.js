import axios from 'axios';

class LeetCodeProvider {
  /**
   * Validates the username and fetches profile preview metadata.
   * Throws an error if the user is invalid or not found.
   */
  async validate(username) {
    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
            countryName
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

      const matchedUser = response.data?.data?.matchedUser;
      
      if (!matchedUser) {
        throw new Error('LeetCode username not found.');
      }

      return {
        username: matchedUser.username,
        displayName: matchedUser.profile?.realName || null,
        avatarUrl: matchedUser.profile?.userAvatar || null,
        country: matchedUser.profile?.countryName || null,
        profileUrl: `https://leetcode.com/u/${matchedUser.username}/`
      };
    } catch (err) {
      if (err.response) {
        throw new Error(`LeetCode API error: ${err.response.statusText}`);
      }
      throw err;
    }
  }

  /**
   * Syncs the latest statistics for the user.
   */
  async sync(username) {
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

    try {
      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username }
      }, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      });

      if (response.data?.errors) {
        throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
      }

      const matchedUser = response.data?.data?.matchedUser;
      if (!matchedUser) {
        throw new Error('LeetCode username not found during sync.');
      }

      const submissions = matchedUser.submitStats?.acSubmissionNum || [];
      const ranking = matchedUser.profile?.ranking || 0;

      const easy = submissions.find(s => s.difficulty === 'Easy')?.count || 0;
      const medium = submissions.find(s => s.difficulty === 'Medium')?.count || 0;
      const hard = submissions.find(s => s.difficulty === 'Hard')?.count || 0;
      const total = submissions.find(s => s.difficulty === 'All')?.count || 0;

      return {
        globalRank: ranking,
        statistics: {
          totalSolved: total,
          easySolved: easy,
          mediumSolved: medium,
          hardSolved: hard,
          problemStats: {
            easy,
            medium,
            hard,
            total
          }
        }
      };
    } catch (err) {
      if (err.response) {
        throw new Error(`LeetCode Sync API error: ${err.response.statusText}`);
      }
      throw err;
    }
  }
}

export default new LeetCodeProvider();
