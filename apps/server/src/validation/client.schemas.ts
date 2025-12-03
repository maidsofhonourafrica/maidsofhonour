import { z } from 'zod/v4';

/**
 * Client Profile Schema
 */
export const createClientProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  householdSize: z.number().int().positive().optional(),
  childrenCount: z.number().int().min(0).optional(),
  childrenAges: z.array(z.number().int().min(0).max(18)).optional(),
  petsCount: z.number().int().min(0).optional(),
  petsTypes: z.array(z.string()).optional(),
  preferredSpGender: z.enum(["male", "female", "no_preference"]).optional(),
  disabledCareRequired: z.boolean().default(false),
  specificNeeds: z.string().max(1000).optional(),
  county: z.string().max(100).min(1, "County is required"),
  specificLocation: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateClientProfileSchema = createClientProfileSchema.partial();

export type CreateClientProfileInput = z.infer<typeof createClientProfileSchema>;
export type UpdateClientProfileInput = z.infer<typeof updateClientProfileSchema>;
