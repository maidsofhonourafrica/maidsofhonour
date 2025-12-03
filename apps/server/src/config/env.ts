/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on startup.
 * App will fail fast with clear error messages if config is invalid.
 */

import { z } from 'zod/v4';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('5300').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().url().or(z.string().min(1)),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().regex(/^\d+$/).transform(Number),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),

  // Redis
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().regex(/^\d+$/).default('0').transform(Number),

  // Encryption
  ENCRYPTION_PROVIDER: z.enum(['local', 'kms']).default('local'),
  ENCRYPTION_MASTER_KEY: z.string().length(64, 'ENCRYPTION_MASTER_KEY must be 64 characters (32 bytes hex)').optional(),

  // AWS (optional but required for KMS/S3)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_KMS_KEY_ID: z.string().optional(),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_ENDPOINT: z.string().optional(), // For MinIO
  AWS_S3_FORCE_PATH_STYLE: z.string().optional(),

  // SasaPay
  SASAPAY_BASE_URL: z.string().url(),
  SASAPAY_CLIENT_ID: z.string().min(1),
  SASAPAY_CLIENT_SECRET: z.string().min(1),
  SASAPAY_CALLBACK_URL: z.string().url(),

  // WhatsApp
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_CLOUD_API_CALLBACK_URL: z.string().url().optional(),

  // SmileID (Identity Verification)
  SMILE_ID_PARTNER_ID: z.string().optional(),
  SMILE_ID_API_KEY: z.string().optional(),
  SMILE_ID_CALLBACK_URL: z.string().url().optional(),
  PHONE_VERIFICATION_CALLBACK_URL: z.string().url().optional(),
  SMILE_ID_SANDBOX: z.string().optional(),
  SMILE_ID_PROD_LAMBDA_URL: z.string().url().optional(),
  SMILE_ID_TEST_LAMBDA_URL: z.string().url().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Conditional validation
const envWithValidation = envSchema.refine(
  (data) => {
    if (data.ENCRYPTION_PROVIDER === 'local' && !data.ENCRYPTION_MASTER_KEY) {
      return false;
    }
    return true;
  },
  {
    message: 'ENCRYPTION_MASTER_KEY is required when ENCRYPTION_PROVIDER is "local"',
    path: ['ENCRYPTION_MASTER_KEY'],
  }
).refine(
  (data) => {
    if (data.ENCRYPTION_PROVIDER === 'kms' && (!data.AWS_KMS_KEY_ID || !data.AWS_REGION || !data.AWS_ACCESS_KEY_ID || !data.AWS_SECRET_ACCESS_KEY)) {
      return false;
    }
    return true;
  },
  {
    message: 'AWS_KMS_KEY_ID, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required when ENCRYPTION_PROVIDER is "kms"',
    path: ['AWS_KMS_KEY_ID'],
  }
);

// Parse and export
export const env = envWithValidation.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
