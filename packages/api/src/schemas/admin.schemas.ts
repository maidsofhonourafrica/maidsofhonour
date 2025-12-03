import { z } from 'zod/v4';

/**
 * Admin User Management Schemas
 */
export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
  reason: z.string().max(500).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().regex(/^254\d{9}$/).optional(),
  preferredLanguage: z.enum(["en", "sw"]).optional(),
});

/**
 * Admin Payout Approval Schema
 */
export const approvePayoutSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).optional(),
});

/**
 * Admin Issue Update Schema
 */
export const updateIssueSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]),
  assignedTo: z.string().uuid().optional(),
  resolutionNotes: z.string().max(2000).optional(),
});

/**
 * Admin Analytics Query Schema
 */
export const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metrics: z.array(z.string()).optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
