import { z } from 'zod/v4';

/**
 * Create Subscription Schema
 */
export const createSubscriptionSchema = z.object({
  placementId: z.string().uuid(),
  monthlyAmount: z.number().positive(),
  durationMonths: z.number().int().positive(),
  paymentDay: z.number().int().min(1).max(28).default(1),
});

/**
 * Pay Subscription Schema
 */
export const paySubscriptionSchema = z.object({
  phoneNumber: z.string().regex(/^254\d{9}$/),
  network: z.enum(["mpesa", "airtel", "t_kash"]).default("mpesa"),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type PaySubscriptionInput = z.infer<typeof paySubscriptionSchema>;
