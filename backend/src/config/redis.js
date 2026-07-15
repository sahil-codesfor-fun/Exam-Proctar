import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Retry connection every 5 seconds, up to 10 times, then stop to prevent memory leak
      if (retries > 10) return new Error('Redis max retries reached');
      return 5000;
    }
  }
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  console.warn('⚠️ Redis Client Error: Make sure Redis is running. Cache will be disabled.', err.message);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis cache');
  isRedisConnected = true;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

// Connect without blocking the main event loop
redisClient.connect().catch((err) => {
  console.warn('⚠️ Failed to connect to Redis initially. Running without cache.');
});

export { redisClient, isRedisConnected };