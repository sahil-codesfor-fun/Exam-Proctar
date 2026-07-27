class PlatformStrategy {
  async fetchStats(username) {
    throw new Error('fetchStats() must be implemented by concrete strategies.');
  }
}

export default PlatformStrategy;
