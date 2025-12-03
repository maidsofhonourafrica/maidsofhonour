import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import superjson from 'superjson';

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  /**
   * Superjson handles Date objects, undefined, Map, Set, etc.
   * Critical for correct date serialization between server and client
   */
  transformer: superjson,
  
  /**
   * Error formatter - maintains consistency with existing API error format
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause 
            ? error.cause 
            : null,
      },
    };
  },
});

/**
 * Export router and procedure builders
 */
export const router = t.router;
export const middleware = t.middleware;

/**
 * Logging middleware - logs all procedure calls
 */
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  
  console.log(`[tRPC] ${type.toUpperCase()} ${path}`);
  
  const result = await next();
  
  const duration = Date.now() - start;
  console.log(`[tRPC] ${type.toUpperCase()} ${path} - ${duration}ms`);
  
  return result;
});

/**
 * Public procedure - no authentication required
 * Includes logging middleware
 */
export const publicProcedure = t.procedure.use(loggingMiddleware);

/**
 * Protected procedure - requires authentication
 * User must be logged in to access
 */
export const protectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(
    async ({ ctx, next }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // User is now guaranteed to be non-null in subsequent middleware/procedures
      return next({
        ctx: {
          ...ctx,
          user: ctx.user, // TypeScript knows this is non-null now
        },
      });
    }
  );

/**
 * Admin-only procedure - requires admin role
 * User must be authenticated AND have admin userType
 */
export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.userType !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    return next({ ctx });
  }
);

/**
 * Service Provider procedure - requires SP role
 */
export const spProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.userType !== 'service_provider') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Service provider access required',
      });
    }

    return next({ ctx });
  }
);

/**
 * Client procedure - requires client role
 */
export const clientProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.userType !== 'client') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Client access required',
      });
    }

    return next({ ctx });
  }
);
