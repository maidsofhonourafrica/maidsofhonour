import { z } from 'zod/v4';

/**
 * Create Placement Schema
 */
export const createPlacementSchema = z.object({
  serviceCategoryId: z.string().uuid(),
  placementType: z.enum(["one_off", "live_in"]),
  durationMonths: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlySalary: z.number().positive().optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estimatedHours: z.number().positive().optional(),
  expectationsResponsibilities: z.string().max(2000).optional(),
  tasksList: z.array(z.string()).optional(),
  kidsCount: z.number().int().min(0).optional(),
  disabledCareRequired: z.boolean().default(false),
  offDays: z.array(z.string()).optional(),
  useAiMatching: z.boolean().default(true),
  preferredSpId: z.string().uuid().optional(), // If client wants specific SP
});

/**
 * Accept/Reject Placement Schema
 */
export const acceptPlacementSchema = z.object({
  message: z.string().max(500).optional(),
});

export const rejectPlacementSchema = z.object({
  reason: z.string().min(10).max(500),
});

/**
 * Cancel Placement Schema
 */
export const cancelPlacementSchema = z.object({
  reason: z.string().min(10).max(500),
});

export type CreatePlacementInput = z.infer<typeof createPlacementSchema>;
export type AcceptPlacementInput = z.infer<typeof acceptPlacementSchema>;
export type RejectPlacementInput = z.infer<typeof rejectPlacementSchema>;
export type CancelPlacementInput = z.infer<typeof cancelPlacementSchema>;
