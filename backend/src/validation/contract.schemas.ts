import { z } from 'zod/v4';

/**
 * Generate Contract Schema
 */
export const generateContractSchema = z.object({
  placementId: z.string().uuid(),
});

/**
 * Sign Contract Schema
 */
export const signContractSchema = z.object({
  signature: z.string().min(1), // Digital signature (could be user ID + timestamp)
});

export type GenerateContractInput = z.infer<typeof generateContractSchema>;
export type SignContractInput = z.infer<typeof signContractSchema>;
