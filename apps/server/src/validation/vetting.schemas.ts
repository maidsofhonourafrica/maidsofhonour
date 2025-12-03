/**
 * Vetting System Validation Schemas
 *
 * Zod schemas for validating vetting-related requests.
 */

import { z } from 'zod/v4';

/**
 * Biometric Submission Schema
 * Used when SP submits biometric verification results from Smile ID SDK
 */
export const biometricSubmissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  jobId: z.string().min(1, 'Job ID is required'),
  country: z.string().length(2, 'Country must be 2-letter code (e.g., KE)'),
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(1, 'ID number is required'),
});

/**
 * Phone Verification Submission Schema
 */
export const phoneVerificationSchema = z.object({
  country: z.string().length(2, 'Country must be 2-letter code (e.g., KE)'),
  phoneNumber: z
    .string()
    .regex(/^254[17]\d{8}$/, 'Invalid Kenyan phone number (254[17]XXXXXXXX)'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  otherName: z.string().optional(),
  idNumber: z.string().optional(),
  operator: z.string().optional(), // 'safaricom', 'airtel', etc.
});

/**
 * Document Upload Schema
 */
export const documentUploadSchema = z.object({
  documentType: z.enum([
    'pcc',
    'medical_certificate',
    'national_id',
    'passport',
    'educational_certificate',
    'reference_letter',
    'first_aid_cert',
    'baby_care_cert',
    'other',
  ]),
  issuedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

/**
 * Video Upload Schema
 */
export const videoUploadSchema = z.object({
  videoType: z.enum(['self_introduction', 'work_experience', 'skills_demo', 'other']),
});

/**
 * Profile Setup Schema
 */
export const profileSetupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  nationalId: z.string().min(1, 'National ID is required').max(50),
  county: z.string().min(1, 'County is required').max(100),
  subCounty: z.string().max(100).optional(),
  ward: z.string().max(100).optional(),
  specificLocation: z.string().optional(),
  bio: z.string().max(1000).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  educationLevel: z.string().max(100).optional(),
  willingToRelocate: z.boolean().optional(),
  preferredWorkType: z.enum(['live_in', 'live_out', 'both']).optional(),
  childrenCount: z.number().int().min(0).optional(),
  maritalStatus: z.string().max(50).optional(),
  socialMediaLinks: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      tiktok: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .optional(),
  smsNotificationsConsent: z.boolean(),
  skills: z
    .array(
      z.object({
        categoryId: z.string().uuid('Invalid category ID'),
        experienceYears: z.number().int().min(0).max(50).optional(),
        proficiencyLevel: z.enum(['beginner', 'intermediate', 'expert']),
        certified: z.boolean(),
      })
    )
    .min(1, 'At least one skill is required'),
});

/**
 * Admin Review Action Schema
 */
export const adminReviewSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
});

/**
 * Admin Vetting Step Review Schema
 */
export const adminStepReviewSchema = z.object({
  approved: z.boolean(),
  adminNotes: z.string().min(1, 'Admin notes are required').max(1000),
});

/**
 * Admin Vetting Step Update Schema
 */
export const vettingStepUpdateSchema = z.object({
  stepName: z.string().min(1).max(100).optional(),
  stepDescription: z.string().max(500).optional(),
  llmInstructions: z.string().min(1).optional(),
  llmPromptTemplate: z.string().optional(),
  stepOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Admin Create Vetting Step Schema
 */
export const vettingStepCreateSchema = z.object({
  stepName: z.string().min(1, 'Step name is required').max(100),
  stepDescription: z.string().max(500).optional(),
  llmInstructions: z.string().min(1, 'LLM instructions are required'),
  llmPromptTemplate: z.string().optional(),
  applicableTo: z.enum(['service_provider', 'client', 'both']),
  stepOrder: z.number().int().min(0, 'Step order must be non-negative'),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

/**
 * Pagination Query Schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine((n) => n >= 1, 'Page must be at least 1')
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    .default(20),
});

/**
 * Vetting Filter Schema (for admin listing)
 */
export const vettingFilterSchema = paginationSchema.extend({
  status: z
    .enum([
      'incomplete',
      'documents_pending',
      'ai_interview_pending',
      'employer_verification_pending',
      'manual_review_pending',
      'approved',
      'rejected',
    ])
    .optional(),
  flagged: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

/**
 * UUID Param Schema
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
});

/**
 * Service Provider ID Param Schema
 */
export const spIdParamSchema = z.object({
  spId: z.string().uuid('Invalid service provider ID'),
});

/**
 * Document Type Param Schema
 */
export const documentTypeParamSchema = z.object({
  type: z.enum([
    'pcc',
    'medical_certificate',
    'national_id',
    'passport',
    'educational_certificate',
    'reference_letter',
    'first_aid_cert',
    'baby_care_cert',
    'other',
  ]),
});

/**
 * Step ID Param Schema
 */
export const stepIdParamSchema = z.object({
  stepId: z.string().uuid('Invalid step ID'),
});

/**
 * Smile ID Callback Schema
 */
export const smileIdCallbackSchema = z.object({
  job_id: z.string(),
  job_complete: z.boolean(),
  job_success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  result: z.any().optional(),
  partner_params: z
    .object({
      user_id: z.string(),
      job_id: z.string(),
      job_type: z.string().optional(),
    })
    .optional(),
});

/**
 * Phone Verification Callback Schema
 */
export const phoneVerificationCallbackSchema = z.object({
  job_id: z.string().optional(),
  job_complete: z.boolean(),
  job_success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  matched_fields: z.record(z.string(), z.string()).optional(),
  partner_params: z
    .object({
      user_id: z.string().optional(),
    })
    .optional(),
});

// Type exports for use in route handlers
export type BiometricSubmissionInput = z.infer<typeof biometricSubmissionSchema>;
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type AdminReviewInput = z.infer<typeof adminReviewSchema>;
export type AdminStepReviewInput = z.infer<typeof adminStepReviewSchema>;
export type VettingStepUpdateInput = z.infer<typeof vettingStepUpdateSchema>;
export type VettingStepCreateInput = z.infer<typeof vettingStepCreateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type VettingFilterInput = z.infer<typeof vettingFilterSchema>;
export type SmileIdCallbackInput = z.infer<typeof smileIdCallbackSchema>;
export type PhoneVerificationCallbackInput = z.infer<typeof phoneVerificationCallbackSchema>;
