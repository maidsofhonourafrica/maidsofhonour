import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../utils/redis';

/**
 * Rate limiting configuration using Redis
 * Protects against brute-force attacks and API abuse
 */

interface RateLimitOptions {
  max: number; // Maximum requests
  timeWindow: string; // Time window (e.g., '1 minute', '15 minutes')
  ban?: number; // Optional: Ban duration in milliseconds after exceeding limit
}

/**
 * Creates a rate limit configuration for Fastify
 *
 * @param options - Rate limit options
 * @returns Fastify rate limit options
 */
function createRateLimitConfig(options: RateLimitOptions) {
  return {
    max: options.max,
    timeWindow: options.timeWindow,
    ban: options.ban,
    cache: 10000, // Keep 10k rate limit records in memory
    // Use Redis for distributed rate limiting (if available)
    redis: redis.status === 'ready' ? redis : undefined,
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
    // Custom error message
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again later.`,
      statusCode: 429,
    }),
    // Key generator: Use IP address + user ID (if authenticated)
    keyGenerator: (request: any) => {
      const ip = request.ip || request.socket.remoteAddress;
      const userId = request.user?.userId;
      return userId ? `${ip}:${userId}` : ip;
    },
  };
}

/**
 * Apply global rate limiting to Fastify instance
 * Default: 100 requests per 15 minutes per IP
 *
 * @param fastify - Fastify instance
 */
export async function applyGlobalRateLimit(fastify: FastifyInstance) {
  await fastify.register(rateLimit, createRateLimitConfig({
    max: 100,
    timeWindow: '15 minutes',
  }));
}

/**
 * Strict rate limit for login endpoint
 * 5 login attempts per 15 minutes per IP
 * Prevents brute-force password attacks
 */
export const loginRateLimit = createRateLimitConfig({
  max: 5,
  timeWindow: '15 minutes',
  ban: 15 * 60 * 1000, // Ban for 15 minutes after exceeding limit
});

/**
 * Moderate rate limit for registration endpoint
 * 3 registrations per hour per IP
 * Prevents spam account creation
 */
export const registerRateLimit = createRateLimitConfig({
  max: 3,
  timeWindow: '1 hour',
});

/**
 * Rate limit for password reset requests
 * 3 attempts per hour per IP
 */
export const passwordResetRateLimit = createRateLimitConfig({
  max: 3,
  timeWindow: '1 hour',
});

/**
 * Rate limit for OTP/verification code requests
 * 5 attempts per hour per IP
 */
export const otpRateLimit = createRateLimitConfig({
  max: 5,
  timeWindow: '1 hour',
});

/**
 * Rate limit for payment endpoints
 * 10 payment requests per minute per user
 */
export const paymentRateLimit = createRateLimitConfig({
  max: 10,
  timeWindow: '1 minute',
});
