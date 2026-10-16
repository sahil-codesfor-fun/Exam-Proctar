import { createClient } from 'redis';

/**
 * High-Performance In-Memory Store with TTL & Pattern Invalidation
 * Ensures zero-failure, sub-millisecond caching even without Redis.
 */
class MemoryCacheStore {
  constructor(defaultTTL = 300, maxKeys = 2000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    this.maxKeys = maxKeys;
    // Sweep expired keys every 60 seconds
    setInterval(() => this.cleanup(), 60000).unref();
  }

  set(key, data, ttl = this.defaultTTL) {
    // Hard LRU safety cap: If memory store reaches limit, drop oldest entry
    if (this.store.size >= this.maxKeys) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    const expiresAt = Date.now() + (ttl * 1000);
    this.store.set(key, { data, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePattern(pattern) {
    // Converts glob pattern (e.g., 'exams:*') to regex
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

// Optional Remote Redis Client (Only initialized if REDIS_URL is provided)
let redisClient = null;
let isRedisAvailable = false;

const rawRedisUrl = process.env.REDIS_URL;
const hasValidRedisUrl = rawRedisUrl && !rawRedisUrl.includes('localhost') && rawRedisUrl.trim().length > 0;

if (hasValidRedisUrl) {
  try {
    redisClient = createClient({
      url: rawRedisUrl,
      socket: {
        family: 4,
        tls: rawRedisUrl.startsWith('rediss://'),
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ CacheService: Redis max retries reached. Running purely in In-Memory mode.');
            return new Error('Redis max retries reached');
          }
          return 5000;
        }
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ CacheService: Connected to Redis');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      // Do not crash, silently degrade to memory cache
      isRedisAvailable = false;
    });

    redisClient.on('end', () => {
      isRedisAvailable = false;
    });

    redisClient.connect().catch(() => {
      isRedisAvailable = false;
    });
  } catch (err) {
    isRedisAvailable = false;
  }
} else {
  // Pure in-memory mode
  console.log('⚡ CacheService: High-Performance In-Memory Caching Active (Zero-Redis mode)');
}

const DEFAULT_TTL = 300;

class CacheService {
  async set(key, data, ttl = DEFAULT_TTL) {
    // 1. Always store in-memory instantly (0ms latency)
    memoryCache.set(key, data, ttl);

    // 2. Non-blocking optional sync to Redis if available
    if (isRedisAvailable && redisClient?.isOpen) {
      redisClient.set(key, JSON.stringify(data), { EX: ttl }).catch(() => {
        isRedisAvailable = false;
      });
    }
  }

  async get(key) {
    // 1. Check in-memory store first (ultra-fast, sub-millisecond)
    const memData = memoryCache.get(key);
    if (memData !== null) {
      return memData;
    }

    // 2. If not in memory and Redis is available, check Redis
    if (isRedisAvailable && redisClient?.isOpen) {
      try {
        const raw = await redisClient.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          memoryCache.set(key, parsed, DEFAULT_TTL); // Populate local memory
          return parsed;
        }
      } catch {
        isRedisAvailable = false;
      }
    }

    return null;
  }

  async del(key) {
    memoryCache.del(key);
    if (isRedisAvailable && redisClient?.isOpen) {
      redisClient.del(key).catch(() => {});
    }
  }

  async invalidatePattern(pattern) {
    // 1. Invalidate local memory pattern instantly
    memoryCache.invalidatePattern(pattern);

    // 2. Invalidate remote Redis pattern if available
    if (isRedisAvailable && redisClient?.isOpen) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch {
        isRedisAvailable = false;
      }
    }
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

  async invalidateSubjectCaches() {
    await this.invalidatePattern('subjects:*');
    await this.invalidatePattern('dashboard:*');
  }

  async invalidateExamCaches() {
    await this.invalidatePattern('exams:*');
    await this.invalidatePattern('dashboard:*');
  }

  async invalidateFacultyCaches(departmentId) {
    if (departmentId) {
      await this.invalidatePattern(`cache:faculty:*:${departmentId}:*`);
    } else {
      await this.invalidatePattern('cache:faculty:*');
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
