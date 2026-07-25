class PlatformStrategy {
  /**
   * Fetches statistics for the given username.
   * @param {string} username - The platform username to fetch stats for.
   * @returns {Promise<{ totalSolved: number }>} An object containing the total problems solved.
   */
  async fetchStats(username) {
    throw new Error('fetchStats() must be implemented by concrete strategies.');
  }
}

export default PlatformStrategy;
