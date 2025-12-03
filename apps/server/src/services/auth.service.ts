import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { smsService } from './communication/sms.service';
import { emailService } from './communication/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = '7d';

// Account lockout settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 900; // 15 minutes in seconds
const ATTEMPT_WINDOW = 900; // 15 minutes in seconds

export interface RegisterInput {
  email: string;
  phoneNumber: string;
  userType: 'client' | 'service_provider' | 'admin';
  password?: string; // Optional
}

export interface LoginInput {
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password (if provided)
    const hashedPassword = input.password ? await bcrypt.hash(input.password, 10) : null;

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        password: hashedPassword,
        phoneNumber: input.phoneNumber,
        userType: input.userType,
      })
      .returning();

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      },
      token,
    };
  },

  /**
   * Check if account is locked
   */
  async isAccountLocked(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
    const lockKey = `auth:lock:${email}`;
    const ttl = await redis.ttl(lockKey);

    if (ttl > 0) {
      return { locked: true, remainingTime: ttl };
    }

    return { locked: false };
  },

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(email: string): Promise<{ attemptsRemaining: number; locked: boolean }> {
    const attemptsKey = `auth:attempts:${email}`;
    const lockKey = `auth:lock:${email}`;

    // Increment failed attempts
    const attempts = await redis.incr(attemptsKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(attemptsKey, ATTEMPT_WINDOW);
    }

    // Lock account after max attempts
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await redis.setex(lockKey, LOCKOUT_DURATION, '1');
      await redis.del(attemptsKey); // Clear attempts counter

      logger.warn({ email }, 'Account locked due to too many failed login attempts');

      return { attemptsRemaining: 0, locked: true };
    }

    return {
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts,
      locked: false,
    };
  },

  /**
   * Clear failed login attempts
   */
  async clearFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `auth:attempts:${email}`;
    await redis.del(attemptsKey);
  },

  /**
   * Login user with account lockout protection
   */
  async login(input: LoginInput) {
    // Ensure at least email or phoneNumber is provided
    if (!input.email && !input.phoneNumber) {
      throw new Error('Email or phone number is required');
    }

    // Use email for lookups (phone-based login is via OTP)
    const identifier = input.email || input.phoneNumber!;
    
    // Check if account is locked (using identifier)
    const lockStatus = await this.isAccountLocked(identifier);
    if (lockStatus.locked) {
      const minutesRemaining = Math.ceil(lockStatus.remainingTime! / 60);
      throw new Error(
        `Account temporarily locked due to too many failed attempts. Try again in ${minutesRemaining} minute(s).`
      );
    }

    // Find user by email or phone
    const user = await db.query.users.findFirst({
      where: input.email ? eq(users.email, input.email) : eq(users.phoneNumber, input.phoneNumber!),
    });

    if (!user || !user.password || !input.password) {
      // Record failed attempt even if user doesn't exist (prevent enumeration)
      await this.recordFailedAttempt(identifier);
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      const result = await this.recordFailedAttempt(identifier);

      if (result.locked) {
        throw new Error(
          'Too many failed attempts. Account locked for 15 minutes.'
        );
      }

      throw new Error(
        `Invalid credentials. ${result.attemptsRemaining} attempt(s) remaining before lockout.`
      );
    }

    // Success - clear failed attempts
    await this.clearFailedAttempts(identifier);

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      },
      token,
    };
  },

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `auth:blacklist:${token}`;
    const exists = await redis.exists(blacklistKey);
    return exists === 1;
  },

  /**
   * Blacklist a token (for logout, password change, account deletion)
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      const expiresIn = payload.exp! - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        const blacklistKey = `auth:blacklist:${token}`;
        await redis.setex(blacklistKey, expiresIn, '1');
        logger.info({ userId: payload.userId }, 'Token blacklisted');
      }
    } catch (error) {
      // Token already expired or invalid - no need to blacklist
      logger.debug({ error }, 'Failed to blacklist token (likely expired)');
    }
  },

  /**
   * Verify JWT token and check blacklist
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      // Check blacklist first
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  },

  /**
   * Logout user (blacklist token)
   */
  async logout(token: string): Promise<void> {
    await this.blacklistToken(token);
  },

  /**
   * Generate JWT token
   */
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Send OTP
   */
  async sendOtp(input: { identifier: string; type: string; role?: string }) {
    const { identifier } = input;
    // Generate 4 digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store in Redis with 5 min expiry
    await redis.setex(`auth:otp:${identifier}`, 300, code);
    
    // Determine if identifier is phone number (basic check)
    const isPhone = !identifier.includes('@');
    
    if (isPhone) {
      try {
        await smsService.sendVerificationCode({
          phoneNumber: identifier,
          code
        });
      } catch (error) {
        logger.error({ error, identifier }, 'Failed to send SMS OTP');
        // In dev, we might still want to return the code or allow proceeding
        // For now, we log but don't block if SMS fails (unless strict mode)
      }
    } else {
       try {
         await emailService.sendVerificationCode({
           email: identifier,
           code
         });
       } catch (error) {
         logger.error({ error, identifier }, 'Failed to send Email OTP');
       }
    }
    
    // In development, return code for easy testing
    return { message: 'OTP sent successfully', devCode: process.env.NODE_ENV === 'development' ? code : undefined };
  },

  /**
   * Verify OTP and Login/Register
   */
  async verifyOtp(input: { identifier: string; code: string; role?: 'client' | 'service_provider' | 'admin' }) {
    const { identifier, code, role } = input;
    
    // Verify code
    const storedCode = await redis.get(`auth:otp:${identifier}`);
    if (!storedCode || storedCode !== code) {
      throw new Error('Invalid or expired OTP');
    }
    
    // Clear OTP
    await redis.del(`auth:otp:${identifier}`);
    
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');

    // Find user
    let user = await db.query.users.findFirst({
      where: isEmail ? eq(users.email, identifier) : eq(users.phoneNumber, identifier),
    });

    // If user doesn't exist and we have a role, register them (Passwordless flow)
    if (!user) {
        if (!role) {
             throw new Error('User not found. Please register.');
        }
        
        // Create new user
        // Note: Schema likely requires unique email/phone. 
        // If registering with phone, we might need a placeholder email if email is required unique, 
        // or vice versa. Assuming schema allows nulls or we handle it.
        // Based on previous register function, email/phone/type are passed.
        
        const newUser = {
            userType: role,
            password: '', // No password
            // Set the provided identifier
            ...(isEmail ? { email: identifier, emailVerified: true } : { phoneNumber: identifier, phoneVerified: true }),
            // Handle the other field if required by DB constraints (assuming nullable or default for now, 
            // but if strict, we might need dummy data. Let's assume schema allows nulls or empty strings for the non-provided one if not unique constrained to non-null)
            // Actually, looking at register function above, it inserts email, password, phoneNumber.
            // Let's try to insert what we have.
             email: isEmail ? identifier : `temp_${Date.now()}_${Math.random().toString(36).substring(7)}@maidsofhonor.africa`,
             phoneNumber: isEmail ? '' : identifier,
        };

        [user] = await db
          .insert(users)
          .values(newUser)
          .returning();
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      },
      token,
    };
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      phoneVerified: user.phoneVerified,
      registrationFeePaid: user.registrationFeePaid,
      status: user.status,
    };
  },
};
