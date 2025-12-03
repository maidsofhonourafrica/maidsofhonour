import { z } from 'zod/v4';

/**
 * Create Rating Schema
 */
export const createRatingSchema = z.object({
  placementId: z.string().uuid(),
  serviceProviderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
  categories: z.object({
    professionalism: z.number().int().min(1).max(5).optional(),
    punctuality: z.number().int().min(1).max(5).optional(),
    skillLevel: z.number().int().min(1).max(5).optional(),
    communication: z.number().int().min(1).max(5).optional(),
  }).optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
