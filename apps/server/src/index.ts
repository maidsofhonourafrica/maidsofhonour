/**
 * Maids of Honour API Server
 *
 * Entry point for the backend application with comprehensive security features:
 * - Sentry error monitoring
 * - Helmet security headers
 * - Request ID tracking
 * - Rate limiting
 * - Input validation
 * - Database connection pooling
 * - PII redaction in logs
 * - JWT authentication with blacklisting
 */

// CRITICAL: Import Sentry instrument FIRST
require('./instrument');

import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { logger } from './utils/logger';
import { pool } from './db';
import { redis } from './utils/redis';
import { buildApp } from './app';

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];

// Start server
const start = async () => {
  let fastify;
  try {
    fastify = await buildApp();
    const port = env.PORT;
    const host = env.HOST;

    await fastify.listen({ port, host });

    logger.info(
      {
        port,
        host,
        environment: env.NODE_ENV,
        pid: process.pid,
      },
      'Server started successfully'
    );

    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connection verified');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection verified');

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info({ signal }, 'Received shutdown signal');

      try {
        if (fastify) {
          // Close Fastify (stops accepting new requests)
          await fastify.close();
          logger.info('Fastify server closed');
        }

        // Close database pool
        await pool.end();
        logger.info('Database pool closed');

        // Close Redis connection
        await redis.quit();
        logger.info('Redis connection closed');

        // Flush Sentry
        await Sentry.close(2000); // 2 second timeout
        logger.info('Sentry flushed');

        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  });
};

start();
