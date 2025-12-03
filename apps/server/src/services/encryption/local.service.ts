import crypto from 'crypto';
import {
  IEncryptionService,
  EncryptionResult,
  EncryptionMetadata,
  LocalEncryptionConfig,
} from './types';

/**
 * Local AES-256-GCM Encryption Service
 *
 * Fast, synchronous encryption using Node.js crypto module.
 * Perfect for development, testing, and low-scale production.
 *
 * Pros:
 * - Free (no cloud costs)
 * - Fast (~1-5ms per operation)
 * - No network latency
 * - Works offline
 *
 * Cons:
 * - Master key must be secured (if leaked, all data compromised)
 * - No automatic key rotation
 * - No audit logs
 * - Single point of failure
 *
 * Use cases:
 * - Development/testing
 * - Small deployments
 * - Temporary solution before migrating to KMS
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

export class LocalEncryptionService implements IEncryptionService {
  private masterKey: Buffer;

  constructor(config: LocalEncryptionConfig) {
    const { masterKey } = config;

    // Validate key format (should be 64 hex characters = 32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(masterKey)) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be 64 hexadecimal characters (32 bytes). ' +
        'Generate with: openssl rand -hex 32'
      );
    }

    this.masterKey = Buffer.from(masterKey, 'hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: Buffer): Promise<EncryptionResult> {
    // Generate random IV (must be unique for each encryption)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    // Encrypt data
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + AuthTag + EncryptedData
    const encryptedData = Buffer.concat([iv, authTag, encrypted]);

    const metadata: EncryptionMetadata = {
      provider: 'local',
      algorithm: ALGORITHM,
      encryptedAt: new Date().toISOString(),
    };

    return { encryptedData, metadata };
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  async decrypt(
    encryptedData: Buffer,
    metadata: EncryptionMetadata
  ): Promise<Buffer> {
    // Validate provider
    if (metadata.provider !== 'local') {
      throw new Error(
        `Cannot decrypt with LocalEncryptionService: data was encrypted with '${metadata.provider}' provider`
      );
    }

    // Validate minimum length
    if (encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data: too short');
    }

    // Extract components
    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    try {
      // Decrypt and verify authentication tag
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error: any) {
      throw new Error(
        `Decryption failed: ${error.message}. ` +
        'Data may be corrupted or tampered with.'
      );
    }
  }

  /**
   * Encrypt text string (convenience method)
   */
  async encryptText(text: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf8');
    const result = await this.encrypt(buffer);

    // Return as JSON string containing both encrypted data and metadata
    return JSON.stringify({
      encryptedData: result.encryptedData.toString('base64'),
      metadata: result.metadata,
    });
  }

  /**
   * Decrypt text string (convenience method)
   */
  async decryptText(encryptedText: string): Promise<string> {
    const parsed = JSON.parse(encryptedText);
    const encryptedData = Buffer.from(parsed.encryptedData, 'base64');
    const metadata = parsed.metadata as EncryptionMetadata;

    const decrypted = await this.decrypt(encryptedData, metadata);
    return decrypted.toString('utf8');
  }

  /**
   * Get provider name
   */
  getProvider(): 'local' {
    return 'local';
  }

  /**
   * Generate a new encryption key (for setup/rotation)
   *
   * @returns 64-character hex string (32 bytes)
   */
  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }
}
