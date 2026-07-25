import axios from 'axios';
import PlatformStrategy from './PlatformStrategy.js';

class HackerRankStrategy extends PlatformStrategy {
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

  async fetchStats(username) {
    if (!username) return { totalSolved: 0 };

    try {
      const config = this.getAxiosConfig();
      
      const [profileRes, badgesRes] = await Promise.all([
        axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, config),
        axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, config).catch(() => ({ data: { models: [] } }))
      ]);

      const profile = profileRes.data?.model;
      const badges = badgesRes.data?.models || [];
      
      if (!profile) {
        throw new Error('HackerRank profile not found.');
      }

      let totalStars = 0;
      badges.forEach(b => {
        totalStars += (b.stars || 0);
      });

      return { totalSolved: totalStars };
    } catch (err) {
      console.error(`HackerRank Sync Error for ${username}:`, err.message);
      return { totalSolved: 0 };
    }
  }
}

export default new HackerRankStrategy();
