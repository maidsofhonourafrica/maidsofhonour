import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  authResponseSchema,
  sendOtpResponseSchema,
  userProfileSchema,
} from '@project/api';
import { authService } from '../../services/auth.service';

/**
 * Authentication Router
 * Handles user authentication, registration, OTP verification
 * All endpoints reuse existing authService business logic
 */
export const authRouter = router({
  /**
   * Register new user
   * Creates account with email/phone and optional password
   */
  register: publicProcedure
    .input(registerSchema)
    .output(authResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.register(input);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }
    }),

  /**
   * Login with email/phone + password
   * Supports account lockout after failed attempts
   */
  login: publicProcedure
    .input(loginSchema)
    .output(authResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.login(input);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        
        // Check if it's a lockout error
        if (message.includes('locked') || message.includes('attempts')) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message,
          });
        }
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message,
        });
      }
    }),

  /**
   * Send OTP via SMS or Email
   * Used for passwordless authentication
   */
  sendOtp: publicProcedure
    .input(sendOtpSchema)
    .output(sendOtpResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.sendOtp(input);
        
        // Log OTP code in development for easy testing
        if (process.env.NODE_ENV === 'development' && result.devCode) {
          console.log('\n' + '='.repeat(50));
          console.log('🔑 OTP VERIFICATION CODE');
          console.log('='.repeat(50));
          console.log(`Identifier: ${input.identifier}`);
          console.log(`Code: ${result.devCode}`);
          console.log('='.repeat(50) + '\n');
        }
        
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
        });
      }
    }),

  /**
   * Verify OTP and complete authentication
   * Logs in existing user or registers new user (if role provided)
   */
  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .output(authResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.verifyOtp(input);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OTP verification failed';
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }
    }),

  /**
   * Get current user profile
   * Requires authentication
   */
  me: protectedProcedure
    .output(userProfileSchema)
    .query(async ({ ctx }) => {
      try {
        const user = await authService.getUserById(ctx.user.userId);
        return user;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'User not found';
        throw new TRPCError({
          code: 'NOT_FOUND',
          message,
        });
      }
    }),

  /**
   * Logout (blacklist current token)
   * Requires authentication
   */
  logout: protectedProcedure
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx }) => {
      try {
        // Token is available in context from createContext
        if (!ctx.token) {
          throw new Error('No token found in context');
        }

        await authService.logout(ctx.token);

        return {
          success: true,
          message: 'Logged out successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
        });
      }
    }),
});
