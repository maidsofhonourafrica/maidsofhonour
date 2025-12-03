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
