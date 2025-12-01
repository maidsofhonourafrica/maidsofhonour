import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { authService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from '../validation/auth.schemas';
import rateLimit from '@fastify/rate-limit';
import { registerRateLimit, loginRateLimit } from '../middleware/rateLimit';

// Response schemas for documentation
const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  userType: z.string(), // Use string to avoid enum conflicts
});

const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

const userResponseSchema = z.object({
  user: userSchema,
});

const errorResponseSchema = z.object({
  error: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register rate limiting plugin for auth routes
  await fastify.register(rateLimit);

  // Register
  fastify.post<{ Body: RegisterInput }>(
    '/register',
    {
      preHandler: validateBody(registerSchema),
      config: {
        rateLimit: registerRateLimit,
      },
      schema: {
        description: 'Register a new user account',
        tags: ['Authentication'],
        body: registerSchema,
        response: {
          200: authResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authService.register(request.body as RegisterInput);
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // Login
  fastify.post<{ Body: LoginInput }>(
    '/login',
    {
      preHandler: validateBody(loginSchema),
      config: {
        rateLimit: loginRateLimit,
      },
      schema: {
        description: 'Authenticate user and receive JWT token',
        tags: ['Authentication'],
        body: loginSchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authService.login(request.body as LoginInput);
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(401).send({ error: err.message });
      }
    }
  );

  // Get current user
  fastify.get(
    '/me',
    {
      preHandler: requireAuth,
      schema: {
        description: 'Get current authenticated user information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = await authService.getUserById(request.user!.userId);
        return reply.send({ user });
      } catch (error: unknown) {
        const err = error as Error;
        return reply.code(404).send({ error: err.message });
      }
    }
  );
}
