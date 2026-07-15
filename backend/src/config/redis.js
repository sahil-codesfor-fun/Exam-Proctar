import { createClient } from 'redis';

// 🚀 DIAGNOSTIC 1: Did Render actually load the URL?
console.log("🔍 REDIS_URL Status:", process.env.REDIS_URL ? "✅ VIP Pass Loaded" : "❌ MISSING! (Falling back to localhost)");

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    family: 4, // 🚀 DIAGNOSTIC 2: FORCE IPv4! (Stops Render from using incompatible IPv6)
    tls: redisUrl.startsWith('rediss://'),
    rejectUnauthorized: false, 
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error('Redis max retries reached');
      return 5000;
    }
  }
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  // 🚀 DIAGNOSTIC 3: Print the exact internal crash code!
  console.error('🚨 REDIS CRASH REASON:', err.code, err.message);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis cache VIP Room');
  isRedisConnected = true;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

redisClient.connect().catch((err) => {
  console.error('⚠️ Initial connect failed. Reason:', err.code, err.message);
});

export { redisClient, isRedisConnected };
