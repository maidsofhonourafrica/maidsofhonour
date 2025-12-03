import { z } from 'zod/v4';

/**
 * Registration Fee Payment Request Schema
 * Used for both SP and Client registration fee payments
 */
export const payRegistrationFeeSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^254\d{9}$/, "Phone must be in format 254XXXXXXXXX")
    .describe("Phone number for M-Pesa STK push"),
  network: z
    .enum(["mpesa", "airtel", "t_kash"])
    .default("mpesa")
    .describe("Payment network"),
});

export type PayRegistrationFeeInput = z.infer<typeof payRegistrationFeeSchema>;
