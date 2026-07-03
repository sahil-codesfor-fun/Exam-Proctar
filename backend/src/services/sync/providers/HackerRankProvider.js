import axios from 'axios';

class HackerRankProvider {
  /**
   * Validates the username and fetches profile preview metadata.
   */
  async validate(username) {
    try {
      const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });

      const profile = response.data?.model;
      if (!profile) {
        throw new Error('HackerRank profile not found.');
      }

      return {
        username: profile.username,
        displayName: profile.name || null,
        avatarUrl: profile.avatar || null,
        country: profile.country || null,
        profileUrl: `https://www.hackerrank.com/profile/${profile.username}`
      };
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('HackerRank username not found.');
      }
      throw new Error(`HackerRank API error: ${err.message}`);
    }
  }

  /**
   * Syncs the latest statistics for the user.
   */
  async sync(username) {
    try {
      const [profileRes, badgesRes] = await Promise.all([
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      ]);

      const profile = profileRes.data?.model;
      const badges = badgesRes.data?.models || [];
      
      if (!profile) {
        throw new Error('HackerRank profile not found during sync.');
      }

      // Aggregate stars or badge info as a proxy for stats if exact problem counts aren't available publicly.
      // E.g. we can store total badges or stars as 'activityStats'
      let totalStars = 0;
      let totalBadges = badges.length;
      badges.forEach(b => {
        totalStars += (b.stars || 0);
      });

      // HackerRank doesn't expose easy/medium/hard solved publicly on REST without auth easily.
      // So we store what we can in generic fields.
      return {
        globalRank: profile.level || 0, // Fallback to level
        statistics: {
          totalSolved: totalStars, // proxy for now
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          activityStats: {
            badges: totalBadges,
            stars: totalStars,
            followers: profile.followers_count || 0
          }
        }
      };
    } catch (err) {
      throw new Error(`HackerRank Sync API error: ${err.message}`);
    }
  }
}

export default new HackerRankProvider();
