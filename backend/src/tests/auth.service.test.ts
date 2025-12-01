import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/auth.service';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the database
vi.mock('../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock Redis
vi.mock('../utils/redis', () => ({
  redis: {
    ttl: vi.fn().mockResolvedValue(-1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: 'hashed_password',
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      // Mock findFirst to return null (user doesn't exist)
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      // Mock insert chain
      const mockReturning = vi.fn().mockResolvedValue([mockUser]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '254722000000',
        userType: 'client',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.phoneNumber).toBe('254722000000');
      expect(result.user.userType).toBe('client');
      expect(typeof result.token).toBe('string');
    });

    it('should throw error if user already exists', async () => {
      // Mock findFirst to return an existing user
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: 'hash',
        phoneNumber: '254722000000',
        userType: 'client',
      } as any);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '254722000000',
          userType: 'client',
        })
      ).rejects.toThrow('User already exists');
    });

    it('should hash the password before storing', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      const mockReturning = vi.fn().mockResolvedValue([mockUser]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

      const bcryptSpy = vi.spyOn(bcrypt, 'hash');

      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '254722000000',
        userType: 'client',
      });

      expect(bcryptSpy).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: hashedPassword,
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(typeof result.token).toBe('string');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: hashedPassword,
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user has no password', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: null,
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user locked out', async () => {
      // Mock user found
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        phoneNumber: '254722000000',
        userType: 'client',
        isActive: true,
        isVerified: true,
      } as any);

      // Mock lockout check (ttl > 0 means locked)
      const { redis } = await import('../utils/redis');
      vi.mocked(redis.ttl).mockResolvedValue(300); // 5 minutes left

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('temporarily locked');
    });
  });

  describe('sendOtp', () => {
    it('should generate and store OTP for phone number', async () => {
      const { redis } = await import('../utils/redis');
      
      await authService.sendOtp({
        identifier: '254712345678',
        type: 'login',
      });

      expect(redis.setex).toHaveBeenCalled();
      const call = vi.mocked(redis.setex).mock.calls[0];
      expect(call[0]).toBe('auth:otp:254712345678');
      expect(call[1]).toBe(300); // 5 minutes
      expect(call[2]).toMatch(/^\d{4}$/); // 4-digit code
    });

    it('should generate and store OTP for email', async () => {
      const { redis } = await import('../utils/redis');
      
      await authService.sendOtp({
        identifier: 'test@example.com',
        type: 'login',
      });

      expect(redis.setex).toHaveBeenCalled();
      const call = vi.mocked(redis.setex).mock.calls[0];
      expect(call[0]).toBe('auth:otp:test@example.com');
      expect(call[1]).toBe(300);
      expect(call[2]).toMatch(/^\d{4}$/);
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP and return user + token', async () => {
      const { redis } = await import('../utils/redis');
      
      // Mock OTP in Redis
      vi.mocked(redis.get as any).mockResolvedValue('1234');
      
      // Mock existing user
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        phoneNumber: '254712345678',
        userType: 'client',
        isActive: true,
        isVerified: true,
      } as any);

      const result = await authService.verifyOtp({
        identifier: '254712345678',
        code: '1234',
        role: 'client',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(redis.del).toHaveBeenCalledWith('auth:otp:254712345678');
    });

    it('should throw error for invalid OTP', async () => {
      const { redis } = await import('../utils/redis');
      
      // Mock OTP in Redis
      vi.mocked(redis.get as any).mockResolvedValue('1234');

      await expect(
        authService.verifyOtp({
          identifier: '254712345678',
          code: '9999', // Wrong code
          role: 'client',
        })
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('should throw error for expired OTP', async () => {
      const { redis } = await import('../utils/redis');
      
      // Mock no OTP in Redis (expired)
      vi.mocked(redis.get as any).mockResolvedValue(null);

      await expect(
        authService.verifyOtp({
          identifier: '254712345678',
          code: '1234',
          role: 'client',
        })
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('should create new user if not exists (passwordless registration)', async () => {
      const { redis } = await import('../utils/redis');
      
      // Mock OTP in Redis
      vi.mocked(redis.get as any).mockResolvedValue('1234');
      
      // Mock no existing user
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      
      // Mock user creation
      const mockNewUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        phoneNumber: null,
        userType: 'client',
        isActive: true,
        isVerified: true,
      };
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockNewUser]),
        }),
      } as any);

      const result = await authService.verifyOtp({
        identifier: 'newuser@example.com',
        code: '1234',
        role: 'client',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return decoded payload', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      };

      const token = authService.generateToken(payload);
      const result = await authService.verifyToken(token);

      expect(result.userId).toBe(payload.userId);
      expect(result.email).toBe(payload.email);
      expect(result.userType).toBe(payload.userType);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid.token.here')).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error for expired token', async () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      };

      // Create a token that is already expired (expiration set to 1 second ago)
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '-1s',
      });

      await expect(authService.verifyToken(expiredToken)).rejects.toThrow(
        'Token expired'
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      };

      const token = authService.generateToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.userType).toBe(payload.userType);
    });

    it('should set token expiration to 7 days', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'client',
      };

      const token = authService.generateToken(payload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 10); // +10 for timing tolerance
    });
  });

  describe('getUserById', () => {
    it('should return user data by ID', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        phoneNumber: '254722000000',
        userType: 'client' as const,
        phoneVerified: false,
        registrationFeePaid: false,
        status: 'pending' as const,
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      const result = await authService.getUserById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.phoneNumber).toBe(mockUser.phoneNumber);
      expect(result.userType).toBe(mockUser.userType);
      expect(result).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should throw error if user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      await expect(
        authService.getUserById('nonexistent-id')
      ).rejects.toThrow('User not found');
    });
  });
});
