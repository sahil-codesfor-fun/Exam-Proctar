import axios from 'axios';
import * as cheerio from 'cheerio';
import PlatformStrategy from './PlatformStrategy.js';

class CodeChefStrategy extends PlatformStrategy {
  async fetchStats(username) {
    if (!username) return { totalSolved: 0 };

    const url = `https://www.codechef.com/users/${username}`;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const fullySolvedText = $('h3:contains("Fully Solved")').text();
      const fullySolvedMatch = fullySolvedText.match(/\((\d+)\)/);
      const total = fullySolvedMatch ? parseInt(fullySolvedMatch[1], 10) : 0;

      return { totalSolved: total };
    } catch (err) {
      console.error(`CodeChef Sync Error for ${username}:`, err.message);
      return { totalSolved: 0 };
    }
  }
}

export default new CodeChefStrategy();
