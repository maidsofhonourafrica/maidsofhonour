import { redis } from '../utils/redis';

/**
 * Idempotency Service
 * Prevents duplicate processing of payment callbacks and other critical operations
 * Uses Redis for distributed idempotency across multiple server instances
 */

const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
const DEFAULT_TTL = 86400; // 24 hours in seconds

export class IdempotencyService {
  /**
   * Check if an operation has already been processed
   *
   * @param key - Unique identifier for the operation (e.g., CheckoutRequestID)
   * @param ttl - Time to live in seconds (default: 24 hours)
   * @returns true if already processed, false if new
   */
  async isProcessed(key: string, ttl: number = DEFAULT_TTL): Promise<boolean> {
    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
      const exists = await redis.exists(redisKey);
      return exists === 1;
    } catch (error) {
      console.error('Idempotency check failed (Redis error):', error);
      // On Redis failure, allow processing to prevent blocking legitimate requests
      // This is a fail-open approach - better to risk duplicate than block valid requests
      return false;
    }
  }

  /**
   * Mark an operation as processed
   *
   * @param key - Unique identifier for the operation
   * @param data - Optional data to store (for debugging/audit trail)
   * @param ttl - Time to live in seconds (default: 24 hours)
   */
  async markProcessed(key: string, data?: any, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
      const value = JSON.stringify({
        processedAt: new Date().toISOString(),
        data: data || null,
      });

      await redis.setex(redisKey, ttl, value);
    } catch (error) {
      console.error('Failed to mark operation as processed (Redis error):', error);
      // Log error but don't throw - operation already completed successfully
    }
  }

  /**
   * Get the data associated with a processed operation
   *
   * @param key - Unique identifier for the operation
   * @returns Stored data or null if not found
   */
  async getProcessedData(key: string): Promise<any | null> {
    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
      const value = await redis.get(redisKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to get processed data (Redis error):', error);
      return null;
    }
  }

  /**
   * Atomic check-and-set operation for idempotency
   * Returns true if operation can proceed, false if already processed
   *
   * @param key - Unique identifier for the operation
   * @param ttl - Time to live in seconds (default: 24 hours)
   * @returns true if operation can proceed (first time), false if duplicate
   */
  async tryAcquire(key: string, ttl: number = DEFAULT_TTL): Promise<boolean> {
    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
      // NX = only set if not exists, EX = set expiry in seconds
      // Returns 'OK' if set, null if key already exists
      const result = await redis.set(redisKey, new Date().toISOString(), 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Idempotency tryAcquire failed (Redis error):', error);
      // Fail-open: allow processing on Redis error
      return true;
    }
  }

  /**
   * Delete an idempotency key (for testing or manual intervention)
   *
   * @param key - Unique identifier for the operation
   */
  async delete(key: string): Promise<void> {
    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
      await redis.del(redisKey);
    } catch (error) {
      console.error('Failed to delete idempotency key (Redis error):', error);
    }
  }

  /**
   * Clear all idempotency keys (for testing only!)
   * WARNING: Use with caution in production
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await redis.keys(`${IDEMPOTENCY_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} idempotency keys`);
      }
    } catch (error) {
      console.error('Failed to clear idempotency keys (Redis error):', error);
    }
  }
}

export const idempotencyService = new IdempotencyService();
