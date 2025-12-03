import { z } from 'zod/v4';

/**
 * Service Provider Profile Schema
 */
export const createSpProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationalId: z.string().min(1).max(50),
  county: z.string().min(1).max(100),
  subCounty: z.string().max(100).optional(),
  ward: z.string().max(100).optional(),
  specificLocation: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bio: z.string().max(1000).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  educationLevel: z.string().max(100).optional(),
  willingToRelocate: z.boolean().default(false),
  preferredWorkType: z.enum(["live_in", "live_out", "both"]).optional(),
  childrenCount: z.number().int().min(0).optional(),
  maritalStatus: z.string().max(50).optional(),
  skills: z
    .array(
      z.object({
        categoryId: z.string().uuid(),
        experienceYears: z.number().int().min(0).max(50).optional(),
        proficiencyLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
      })
    )
    .optional(),
});

export const updateSpProfileSchema = createSpProfileSchema.partial();

/**
 * SP Search Schema
 */
export const searchSpsSchema = z.object({
  category: z.string().uuid().optional(),
  county: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxDistance: z.number().positive().optional(), // km
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
  workType: z.enum(["live_in", "live_out", "both"]).optional(),
  minExperience: z.number().int().min(0).optional(),
  available: z.boolean().default(true),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

/**
 * Payout Request Schema
 */
export const requestPayoutSchema = z.object({
  amount: z.number().positive(),
  phoneNumber: z
    .string()
    .regex(/^254\d{9}$/, "Phone must be in format 254XXXXXXXXX")
    .optional(),
  network: z.enum(["mpesa", "airtel"]).default("mpesa"),
});

export type CreateSpProfileInput = z.infer<typeof createSpProfileSchema>;
export type UpdateSpProfileInput = z.infer<typeof updateSpProfileSchema>;
export type SearchSpsInput = z.infer<typeof searchSpsSchema>;
export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;
