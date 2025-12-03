import { z } from 'zod/v4';

/**
 * SasaPay C2B Callback Validation Schema
 * Based on SasaPay API documentation
 */
export const sasapayCallbackSchema = z.object({
  // Required fields from SasaPay callback
  CheckoutRequestID: z.string().min(1, 'CheckoutRequestID is required'),
  MerchantRequestID: z.string().min(1, 'MerchantRequestID is required'),

  // Result information
  ResultCode: z.string().min(1, 'ResultCode is required'),
  ResultDesc: z.string().min(1, 'ResultDesc is required'),

  // Transaction details (optional fields that may not always be present)
  TransactionDate: z.string().optional(),
  TransactionCode: z.string().optional(),
  ThirdPartyTransID: z.string().optional(),

  // Additional metadata that might be included
  AccountReference: z.string().optional(),
  TransactionDesc: z.string().optional(),
  Amount: z.string().optional(),
  PhoneNumber: z.string().optional(),
});

/**
 * Type export for TypeScript
 */
export type SasaPayCallback = z.infer<typeof sasapayCallbackSchema>;

/**
 * Validate SasaPay callback and return parsed data
 * Throws ZodError if validation fails
 */
export function validateSasaPayCallback(data: unknown): SasaPayCallback {
  return sasapayCallbackSchema.parse(data);
}

/**
 * Safely validate SasaPay callback without throwing
 * Returns parsed data or null if invalid
 */
export function safeParseSasaPayCallback(data: unknown): SasaPayCallback | null {
  const result = sasapayCallbackSchema.safeParse(data);
  return result.success ? result.data : null;
}
