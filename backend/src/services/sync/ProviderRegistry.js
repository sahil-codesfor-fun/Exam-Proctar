class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(platform, provider) {
    this.providers.set(platform, provider);
  }

  get(platform) {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new Error(`No provider registered for platform: ${platform}`);
    }
    return provider;
  }
}

// Singleton instance
const registry = new ProviderRegistry();
export default registry;
