import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import requestContext from '@fastify/request-context';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { randomUUID } from 'crypto';
import { env } from './config/env';
import { safeLogger } from './utils/logger';
import { pool } from './db';
import { redis } from './utils/redis';

// Import routes
import { authRoutes } from './routes/auth';
import { paymentRoutes } from './routes/payments';
import { whatsappRoutes } from './routes/whatsapp';
import { sasapayCallbackRoutes } from './routes/sasapay-callback';
import { escrowRoutes } from './routes/escrow';
import { spVettingRoutes } from './routes/sp-vetting';
import { adminVettingRoutes } from './routes/admin-vetting';
import { vettingCallbackRoutes } from './routes/vetting-callbacks';
import { registrationFeeRoutes } from './routes/registration-fees';
import { serviceProviderRoutes } from './routes/service-providers';
import { clientRoutes } from './routes/clients';
import { placementRoutes } from './routes/placements';
import { contractRoutes } from './routes/contracts';
import { subscriptionRoutes } from './routes/subscriptions';
import { ratingRoutes } from './routes/ratings';
import { messagingRoutes } from './routes/messages';
import { issueRoutes } from './routes/issues';
import { notificationRoutes } from './routes/notifications';
import { trainingRoutes } from './routes/training';
import { certificateRoutes } from './routes/certificates';
import { utilityRoutes } from './routes/utilities';
import { aiAgentRoutes } from './routes/ai-agent';
import { adminRoutes } from './routes/admin';

export async function buildApp() {
  // Create Fastify instance with Zod type provider
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL || 'info',
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },

    // Request limits
    bodyLimit: 10 * 1024 * 1024, // 10MB max body size
    requestTimeout: 30000, // 30 second timeout
    connectionTimeout: 10000, // 10 second connection timeout

    // Trust proxy (for correct IP addresses behind load balancer)
    trustProxy: env.NODE_ENV === 'production',
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod validator and serializer compilers
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Register Sentry error handler (must be before routes)
  Sentry.setupFastifyErrorHandler(fastify);

  // Register request context (for request IDs)
  await fastify.register(requestContext);

  // Add request ID to all requests
  fastify.addHook('onRequest', async (request, reply) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    (request.requestContext as any).set('requestId', requestId);

    // Add to response header
    reply.header('x-request-id', requestId);

    // Add to Sentry context
    Sentry.setContext('request', {
      id: requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
    });
  });

  // Register Helmet security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for webhooks
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  });

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Register Swagger for API documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Maids of Honour API',
        description: 'AI-powered platform for vetting, training, and placement of domestic service providers in Kenya',
        version: '1.0.0',
      },
      servers: [
        {
          url: env.API_URL,
          description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max per file
      files: 5, // Max 5 files per request
    },
  });

  // Global error handler (catches all errors)
  fastify.setErrorHandler((error: unknown, request, reply) => {
    const requestId = (request.requestContext as any).get('requestId') as string | undefined;

    // Type guard for error
    const err = error as Error & { statusCode?: number; code?: string };

    // Log error with context
    safeLogger.error(
      {
        err,
        requestId,
        method: request.method,
        url: request.url,
        statusCode: err.statusCode || 500,
      },
      'Request error'
    );

    // Send to Sentry
    Sentry.captureException(err, {
      extra: {
        requestId,
        method: request.method,
        url: request.url,
        query: request.query,
      },
    });

    // Send sanitized error response
    const isDev = env.NODE_ENV === 'development';
    const statusCode = err.statusCode || 500;

    reply.code(statusCode).send({
      error: {
        message: isDev ? err.message : 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        requestId,
        ...(isDev && { stack: err.stack }),
      },
    });
  });

  // Enhanced health check endpoint
  fastify.get('/health', async (_request, reply) => {
    const checks: Record<string, any> = {
      database: { healthy: false, latency: 0 },
      redis: { healthy: false, latency: 0 },
    };

    // Check database
    const dbStart = Date.now();
    try {
      await pool.query('SELECT 1');
      checks.database.healthy = true;
      checks.database.latency = Date.now() - dbStart;
    } catch (err) {
      safeLogger.error({ err }, 'Database health check failed');
      checks.database.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check Redis
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.redis.healthy = true;
      checks.redis.latency = Date.now() - redisStart;
    } catch (err) {
      safeLogger.error({ err }, 'Redis health check failed');
      checks.redis.error = err instanceof Error ? err.message : 'Unknown error';
    }

    const allHealthy = checks.database.healthy && checks.redis.healthy;
    const statusCode = allHealthy ? 200 : 503;

    return reply.code(statusCode).send({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      checks,
    });
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      message: 'Maids of Honour API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  });

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
  await fastify.register(whatsappRoutes, { prefix: '/api/v1' });
  await fastify.register(sasapayCallbackRoutes, { prefix: '/api/v1/sasapay' });
  await fastify.register(registrationFeeRoutes); // Registration fees (handles both /service-providers and /clients)
  await fastify.register(serviceProviderRoutes); // Service provider routes
  await fastify.register(clientRoutes); // Client routes
  await fastify.register(placementRoutes); // Placement routes
  await fastify.register(contractRoutes); // Contract routes
  await fastify.register(subscriptionRoutes); // Subscription routes
  await fastify.register(ratingRoutes); // Rating routes
  await fastify.register(messagingRoutes); // Messaging routes
  await fastify.register(issueRoutes); // Issue reporting routes
  await fastify.register(notificationRoutes); // Notification routes
  await fastify.register(trainingRoutes); // Training & courses routes
  await fastify.register(certificateRoutes); // Certificate routes
  await fastify.register(utilityRoutes); // Utility routes (categories, counties, health)
  await fastify.register(aiAgentRoutes); // AI Agent routes
  await fastify.register(adminRoutes); // Admin management routes

  // Vetting routes
  await fastify.register(spVettingRoutes);
  await fastify.register(adminVettingRoutes);
  await fastify.register(vettingCallbackRoutes);

  // Legacy routes (for backwards compatibility - will be deprecated)
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(paymentRoutes, { prefix: '/api/payments' });
  await fastify.register(sasapayCallbackRoutes, { prefix: '/api/sasapay' });

  // Register Escrow routes
  await fastify.register(escrowRoutes, { prefix: '/api/escrow' });

  // Sentry test endpoint (development only)
  if (env.NODE_ENV === 'development') {
    fastify.get('/debug-sentry', async () => {
      safeLogger.info(
        { action: 'test_error_endpoint' },
      );

      // Sentry.metrics.increment is not available in this version
      // Sentry.metrics.increment('test_counter', 1);

      throw new Error('My first Sentry error!');
    });
  }

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
        path: request.url,
      },
    });
  });

  return fastify;
}
