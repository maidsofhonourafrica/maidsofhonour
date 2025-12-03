import Redis from 'ioredis';

/**
 * Redis client configuration
 * Used for rate limiting, caching, and session management
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  // Retry strategy: exponential backoff up to 3 seconds
  retryStrategy(times) {
    const delay = Math.min(times * 50, 3000);
    return delay;
  },
  // Connection timeout
  connectTimeout: 10000,
  // Graceful error handling
  lazyConnect: true,
  // Only log errors in production
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Attempt to connect
redis.connect().catch((error) => {
  console.error('❌ Failed to connect to Redis:', error.message);
  console.warn('⚠️  Rate limiting will be disabled. Install and start Redis to enable it.');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
});

process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
});
