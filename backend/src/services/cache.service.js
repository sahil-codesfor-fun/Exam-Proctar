import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisErrorLogged = false;

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: false // Do not endlessly try to reconnect if Redis is down
  }
});

client.on('error', (err) => {
  if (!redisErrorLogged) {
    console.log('Redis Client Error: Make sure Redis is running. Cache will be disabled.');
    redisErrorLogged = true;
  }
});
client.on('connect', () => console.log('Redis Client Connected'));

// Only attempt connection once and handle failures gracefully
if (!client.isOpen) {
  client.connect().catch((err) => {
    console.log('Failed to connect to Redis. Caching is disabled.');
  });
}

const DEFAULT_TTL = 300; // 5 minutes

class CacheService {
  async set(key, data, ttl = DEFAULT_TTL) {
    try {
      if (client.isOpen) {
        await client.set(key, JSON.stringify(data), { EX: ttl });
      }
    } catch (err) {
      console.error(`Cache Service Set Error (${key}):`, err);
    }
  }

  async get(key) {
    try {
      if (client.isOpen) {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      console.error(`Cache Service Get Error (${key}):`, err);
    }
    return null;
  }

  async del(key) {
    try {
      if (client.isOpen) {
        await client.del(key);
      }
    } catch (err) {
      console.error(`Cache Service Del Error (${key}):`, err);
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (client.isOpen) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
        }
      }
    } catch (err) {
      console.error(`Cache Service Invalidate Error (${pattern}):`, err);
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
}

export const cacheService = new CacheService();
export default cacheService;
