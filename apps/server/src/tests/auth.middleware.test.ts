import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireRole } from '../middleware/auth';
import { authService } from '../services/auth.service';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('Auth Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('requireAuth', () => {
    it('should attach user to request with valid token', async () => {
      const token = authService.generateToken({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await requireAuth(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockRequest.user?.email).toBe('test@example.com');
      expect(mockRequest.user?.userType).toBe('client');
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      await requireAuth(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic sometoken',
      };

      await requireAuth(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      vi.spyOn(authService, 'verifyToken').mockRejectedValue(new Error('Invalid token'));

      await requireAuth(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/invalid|malformed/i),
        })
      );
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = 'expired.token';

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      vi.spyOn(authService, 'verifyToken').mockRejectedValue(new Error('Token expired'));

      await requireAuth(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/expired/i),
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should allow access if user has required role', async () => {
      mockRequest.user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'admin',
      };

      const middleware = requireRole('admin', 'service_provider');
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const middleware = requireRole('admin');
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 403 if user does not have required role', async () => {
      mockRequest.user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      };

      const middleware = requireRole('admin');
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should allow access if user has one of multiple required roles', async () => {
      mockRequest.user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'service_provider',
      };

      const middleware = requireRole('admin', 'service_provider');
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
});
