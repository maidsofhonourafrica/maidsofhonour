import { z } from 'zod/v4';

/**
 * Report Issue Schema
 */
export const reportIssueSchema = z.object({
  placementId: z.string().uuid(),
  issueType: z.enum([
    "payment_dispute",
    "service_quality",
    "contract_breach",
    "safety_concern",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  description: z.string().min(20).max(2000),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export type ReportIssueInput = z.infer<typeof reportIssueSchema>;
