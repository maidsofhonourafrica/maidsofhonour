/**
 * Encryption Service
 *
 * Provides unified encryption interface with multiple providers:
 * - Local AES-256-GCM (development/testing)
 * - AWS KMS (production)
 *
 * Usage:
 *
 * ```typescript
 * import { encryptionService } from './services/encryption';
 *
 * // Encrypt file
 * const { encryptedData, metadata } = await encryptionService.encrypt(fileBuffer);
 *
 * // Store in database
 * await db.insert(documents).values({
 *   encryptedData,
 *   encryptionMetadata: metadata
 * });
 *
 * // Decrypt later
 * const decrypted = await encryptionService.decrypt(encryptedData, metadata);
 * ```
 *
 * Configuration (via environment variables):
 *
 * **Local Provider (default):**
 * ```
 * ENCRYPTION_PROVIDER=local
 * ENCRYPTION_MASTER_KEY=<64-hex-chars>  # Generate with: openssl rand -hex 32
 * ```
 *
 * **AWS KMS Provider:**
 * ```
 * ENCRYPTION_PROVIDER=kms
 * AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/...
 * AWS_REGION=us-east-1
 * AWS_ACCESS_KEY_ID=<your-access-key>      # Optional
 * AWS_SECRET_ACCESS_KEY=<your-secret-key>  # Optional
 * ```
 */

// Export types
export * from './types';

// Export service classes
export { LocalEncryptionService } from './local.service';
export { KMSEncryptionService } from './kms.service';

// Export factory functions
export {
  createEncryptionService,
  getEncryptionService,
  resetEncryptionService,
} from './factory';

// Export singleton instance (lazy-loaded)
import { getEncryptionService } from './factory';
export const encryptionService = getEncryptionService;
