import { z } from 'zod/v4';

/**
 * Validation schema for user registration
 * Enforces valid email and phone numbers. Password is optional.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .describe('Password (e.g. StrongP@ssw0rd!)')
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^254[17]\d{8}$/,
      'Phone number must be in format 254XXXXXXXXX (Kenyan format)'
    )
    .describe('Phone number (e.g. 254712345678)'),
  userType: z.enum(['client', 'service_provider', 'admin'], {
    message: 'Invalid user type',
  }),
});

/**
 * Validation schema for user login
 * Password is optional to support OTP-only login.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^254[17]\d{8}$/,
      'Phone number must be in format 254XXXXXXXXX (Kenyan format)'
    )
    .optional(),
  password: z
    .string()
    .min(1, 'Password is required')
    .optional(),
}).refine((data) => data.email || data.phoneNumber, {
  message: "Either email or phone number must be provided",
  path: ["email"],
});

/**
 * Schema for sending OTP
 */
export const sendOtpSchema = z.object({
  identifier: z.string().trim().min(1, "Email or Phone number is required"),
  type: z.enum(['login', 'register']).default('login'),
  role: z.enum(['client', 'service_provider', 'admin']).optional(),
});

/**
 * Schema for verifying OTP
 */
export const verifyOtpSchema = z.object({
  identifier: z.string().trim().min(1, "Email or Phone number is required"),
  code: z.string().length(4, "OTP must be 4 digits"),
  role: z.enum(['client', 'service_provider', 'admin']).optional(),
});

/**
 * Type exports for TypeScript
 * These types explicitly define what the schemas accept, including optional fields
 */
export type RegisterInput = {
  email: string;
  phoneNumber: string;
  userType: 'client' | 'service_provider' | 'admin';
  password?: string; // Optional
};

export type LoginInput = {
  email?: string; // At least one of email or phoneNumber required
  phoneNumber?: string;
  password?: string; // Optional for OTP-based login
};

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ===== RESPONSE SCHEMAS =====
// These schemas define what the API RETURNS to clients
// Verified against actual service return values (auth.service.ts)

/**
 * User object (subset of fields from users table)
 * Source: apps/server/src/db/schema.ts lines 135-150
 * Fields verified against authService.login() line 198-203
 * Fields verified against authService.getUserById() line 397-405
 */
export const userSchema = z.object({
  // DB field: id (line 136) - UUID primary key
  id: z.string().uuid(),
  
  // DB field: email (line 137) - varchar(255)
  email: z.string().email(),
  
  // DB field: phoneNumber (line 139) - varchar(15)
  phoneNumber: z.string(),
  
  // DB field: userType (line 140) - enum
  userType: z.enum(['client', 'service_provider', 'admin']),
  
  // Optional fields (only in getUserById response - line 402-404)
  // Using nullish() to handle both null (from DB) and undefined
  phoneVerified: z.boolean().nullish(),
  registrationFeePaid: z.boolean().nullish(),
  status: z.enum(['pending', 'active', 'suspended', 'banned']).nullish(),
});

/**
 * Authentication response (login, register, verifyOtp)
 * Source: authService.login() line 197-205
 * Source: authService.register() line 73-81
 * Source: authService.verifyOtp() line 374-382
 */
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

/**
 * Send OTP response
 * Source: authService.sendOtp() line 310
 */  
export const sendOtpResponseSchema = z.object({
  message: z.string(),
  devCode: z.string().optional(), // Only in development
});

/**
 * User profile response (from /me endpoint)
 * Source: authService.getUserById() line 397-405
 */
export const userProfileSchema = userSchema;

// Export response types
export type UserResponse = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type SendOtpResponse = z.infer<typeof sendOtpResponseSchema>;
export type UserProfileResponse = z.infer<typeof userProfileSchema>;
