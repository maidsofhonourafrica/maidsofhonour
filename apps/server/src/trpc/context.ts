import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

/**
 * User payload from JWT token
 * Matches the structure from middleware/auth.ts
 */
export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'client' | 'service_provider' | 'admin';
}

/**
 * tRPC Context
 * Contains request, response, authenticated user (if logged in), and the raw token
 */
export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
  user: JWTPayload | null;
  token: string | null; // Raw JWT token for operations like logout
}

/**
 * Create context for tRPC procedures
 * Extracts user from JWT token if present
 */
export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest;
  res: FastifyReply;
}): Promise<Context> {
  let user: JWTPayload | null = null;
  let token: string | null = null;

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      
      // Verify token using existing auth service
      const payload = await authService.verifyToken(token);
      
      user = {
        userId: payload.userId,
        email: payload.email,
        userType: payload.userType as 'client' | 'service_provider' | 'admin',
      };
    }
  } catch (error) {
    // Token invalid - user and token remain null
    // tRPC procedures will handle authentication as needed
  }

  return {
    req,
    res,
    user,
    token,
  };
}
