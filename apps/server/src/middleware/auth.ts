import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      userId: string;
      email: string;
      userType: string;
    };
  }
}

/**
 * Authentication middleware - verifies JWT token and checks blacklist
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token (now async - checks blacklist)
    const payload = await authService.verifyToken(token);

    // Attach user to request
    request.user = {
      id: payload.userId,
      ...payload,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid or expired token';
    return reply.code(401).send({ error: message });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);
      request.user = {
        id: payload.userId,
        ...payload,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
}

/**
 * Role-based middleware - requires specific user type
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    if (!roles.includes(request.user.userType)) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}

/**
 * Admin-only middleware
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  if (request.user.userType !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}
