import { IEncryptionService } from './types';
import { LocalEncryptionService } from './local.service';
import { KMSEncryptionService } from './kms.service';

/**
 * Encryption Service Factory
 *
 * Creates the appropriate encryption service based on environment configuration.
 * Allows seamless switching between local and KMS encryption via env vars.
 *
 * Environment variables:
 * - ENCRYPTION_PROVIDER: 'local' | 'kms' (defaults to 'local')
 * - ENCRYPTION_MASTER_KEY: Required for local provider
 * - AWS_KMS_KEY_ID: Required for KMS provider
 * - AWS_REGION: AWS region (defaults to 'us-east-1')
 * - AWS_ACCESS_KEY_ID: AWS credentials (optional, uses default chain)
 * - AWS_SECRET_ACCESS_KEY: AWS credentials (optional, uses default chain)
 */

let cachedService: IEncryptionService | null = null;

export function createEncryptionService(): IEncryptionService {
  // Return cached instance if available (singleton pattern)
  if (cachedService) {
    return cachedService;
  }

  const provider = (process.env.ENCRYPTION_PROVIDER || 'local').toLowerCase();

  if (provider === 'local') {
    // Local AES-256-GCM encryption
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;

    if (!masterKey) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY environment variable is required for local encryption. ' +
        'Generate with: openssl rand -hex 32'
      );
    }

    cachedService = new LocalEncryptionService({ masterKey });
    console.log('✅ Encryption service initialized: LOCAL (AES-256-GCM)');

  } else if (provider === 'kms') {
    // AWS KMS encryption
    const keyId = process.env.AWS_KMS_KEY_ID;

    if (!keyId) {
      throw new Error(
        'AWS_KMS_KEY_ID environment variable is required for KMS encryption. ' +
        'Example: arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
      );
    }

    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    cachedService = new KMSEncryptionService({
      keyId,
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });

    console.log(`✅ Encryption service initialized: AWS KMS (${region || 'default region'})`);

  } else {
    throw new Error(
      `Invalid ENCRYPTION_PROVIDER: '${provider}'. Must be 'local' or 'kms'.`
    );
  }

  return cachedService;
}

/**
 * Reset cached service (for testing only)
 */
export function resetEncryptionService(): void {
  cachedService = null;
}

/**
 * Get encryption service instance (lazy singleton)
 */
export function getEncryptionService(): IEncryptionService {
  return createEncryptionService();
}
