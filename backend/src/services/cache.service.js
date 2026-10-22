/**
 * High-Speed Universal In-Memory Cache Service
 * Provides sub-millisecond, crash-proof caching without external Redis dependency.
 */

class MemoryCacheStore {
  constructor(defaultTtlSeconds = 300) {
    this.store = new Map();
    this.defaultTtl = defaultTtlSeconds * 1000;
    // Periodic garbage collection every 60s
    setInterval(() => this.cleanup(), 60000).unref();
  }

  set(key, data, ttlSeconds) {
    const ttl = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl);
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { data, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePattern(pattern) {
    const regexPattern = '^' + pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') + '$';
    const regex = new RegExp(regexPattern);

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCacheStore(300);
const DEFAULT_TTL = 300;

class CacheService {
  async set(key, data, ttl = DEFAULT_TTL) {
    memoryCache.set(key, data, ttl);
  }

  async get(key) {
    return memoryCache.get(key);
  }

  async del(key) {
    memoryCache.del(key);
  }

  async invalidatePattern(pattern) {
    memoryCache.invalidatePattern(pattern);
  }

  async invalidateDashboardCaches() {
    await this.invalidatePattern('dashboard:*');
    await this.invalidatePattern('analytics:*');
  }

  async invalidateDepartmentCaches() {
    await this.invalidatePattern('departments:*');
    await this.invalidatePattern('dashboard:*');
  }

  async invalidateUserCaches() {
    await this.invalidatePattern('users:*');
    await this.invalidatePattern('dashboard:*');
  }

  async invalidatePracticeCaches() {
    await this.invalidatePattern('practice:*');
  }

  async invalidateExamCaches() {
    await this.invalidatePattern('exam:*');
  }
}

export default new CacheService();
