import axios from 'axios';

class HackerRankProvider {
  // 🌮 THE VIP PASS: We need a full, realistic set of headers to bypass HackerRank's bot protection!
  getAxiosConfig() {
    return {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.hackerrank.com/',
      },
      timeout: 10000
    };
  }

  /**
   * Validates the username and fetches profile preview metadata.
   */
  async validate(username) {
    try {
      // Using the more reliable 'contests/master' endpoint for public profiles
      const response = await axios.get(
        `https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, 
        this.getAxiosConfig()
      );

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
      if (err.response?.status === 404 || err.response?.status === 403) {
        throw new Error('HackerRank username not found or access blocked by firewall.');
      }
      throw new Error(`HackerRank API error: ${err.message}`);
    }
  }

  /**
   * Syncs the latest statistics for the user.
   */
  async sync(username) {
    try {
      const config = this.getAxiosConfig();
      
      // Fetch both profile and badges concurrently
      const [profileRes, badgesRes] = await Promise.all([
        axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, config),
        // Badges endpoint fallback to prevent the whole sync from crashing if it fails
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, config).catch(() => ({ data: { models: [] } }))
      ]);

      const profile = profileRes.data?.model;
      const badges = badgesRes.data?.models || [];
      
      if (!profile) {
        throw new Error('HackerRank profile not found during sync.');
      }

      // Aggregate stars or badge info as a proxy for stats
      let totalStars = 0;
      let totalBadges = badges.length;
      badges.forEach(b => {
        totalStars += (b.stars || 0);
      });

      return {
        globalRank: profile.level || 0, // Fallback to level
        statistics: {
          totalSolved: totalStars, // Proxy metric for HackerRank
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