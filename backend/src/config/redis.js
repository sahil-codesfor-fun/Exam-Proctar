import { createClient } from 'redis';

/**
 * Universal In-Memory Store & Fallback Proxy
 * Guarantees that any Redis operation (get, setEx, keys, del, incr) continues
 * to work smoothly in-memory without crashes if Redis is offline or quota exceeded.
 */
class InMemoryRedisProxy {
  constructor(maxKeys = 3000) {
    this.store = new Map();
    this.maxKeys = maxKeys;
    // Clean expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000).unref();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setEx(key, seconds, value) {
    if (this.store.size >= this.maxKeys) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    const expiresAt = Date.now() + (Number(seconds) * 1000);
    this.store.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async set(key, value, options = {}) {
    if (this.store.size >= this.maxKeys) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    let expiresAt = null;
    if (options && options.EX) {
      expiresAt = Date.now() + (Number(options.EX) * 1000);
    }
    this.store.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async incr(key) {
    const current = await this.get(key);
    const nextVal = current ? parseInt(current, 10) + 1 : 1;
    const item = this.store.get(key);
    this.store.set(key, { value: String(nextVal), expiresAt: item?.expiresAt || null });
    return nextVal;
  }

  async del(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    let count = 0;
    for (const k of keyList) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern) {
    const regexPattern = '^' + pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') + '$';
    const regex = new RegExp(regexPattern);

    const matches = [];
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matches.push(key);
      }
    }
    return matches;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const memoryProxy = new InMemoryRedisProxy();

let realRedisClient = null;
let isRealRedisConnected = false;

const rawRedisUrl = process.env.REDIS_URL;
const hasValidRedis = rawRedisUrl && !rawRedisUrl.includes('localhost') && rawRedisUrl.trim().length > 0;

if (hasValidRedis) {
  try {
    realRedisClient = createClient({
      url: rawRedisUrl,
      socket: {
        family: 4,
        tls: rawRedisUrl.startsWith('rediss://'),
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ Redis: Max connection retries reached. Switched to In-Memory mode.');
            return new Error('Redis max retries reached');
          }
          return 5000;
        }
      }
    });

    realRedisClient.on('error', (err) => {
      isRealRedisConnected = false;
    });

    realRedisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
      isRealRedisConnected = true;
    });

    realRedisClient.on('end', () => {
      isRealRedisConnected = false;
    });

    realRedisClient.connect().catch(() => {
      isRealRedisConnected = false;
    });
  } catch (err) {
    isRealRedisConnected = false;
  }
} else {
  console.log('⚡ Redis Client: Running in High-Speed In-Memory Fallback Mode (Zero-Redis)');
}

/**
 * Resilient proxy that routes to real Redis when online,
 * or effortlessly to the in-memory proxy when Redis is down or unavailable.
 */
const redisClient = {
  async get(key) {
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      try {
        const val = await realRedisClient.get(key);
        if (val !== null) return val;
      } catch {
        isRealRedisConnected = false;
      }
    }
    return memoryProxy.get(key);
  },

  async setEx(key, seconds, value) {
    memoryProxy.setEx(key, seconds, value);
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      realRedisClient.setEx(key, seconds, value).catch(() => {
        isRealRedisConnected = false;
      });
    }
    return 'OK';
  },

  async set(key, value, options) {
    memoryProxy.set(key, value, options);
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      realRedisClient.set(key, value, options).catch(() => {
        isRealRedisConnected = false;
      });
    }
    return 'OK';
  },

  async incr(key) {
    const res = await memoryProxy.incr(key);
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      realRedisClient.incr(key).catch(() => {
        isRealRedisConnected = false;
      });
    }
    return res;
  },

  async del(keys) {
    const res = await memoryProxy.del(keys);
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      realRedisClient.del(keys).catch(() => {
        isRealRedisConnected = false;
      });
    }
    return res;
  },

  async keys(pattern) {
    if (isRealRedisConnected && realRedisClient?.isOpen) {
      try {
        return await realRedisClient.keys(pattern);
      } catch {
        isRealRedisConnected = false;
      }
    }
    return memoryProxy.keys(pattern);
  }
};

// Always true because the in-memory proxy is always active and available!
const isRedisConnected = true;

export { redisClient, isRedisConnected };
