import crypto from 'crypto';
import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import {
  IEncryptionService,
  EncryptionResult,
  EncryptionMetadata,
  KMSEncryptionConfig,
} from './types';

/**
 * AWS KMS Encryption Service
 *
 * Production-grade encryption using AWS Key Management Service.
 * Uses envelope encryption pattern for optimal performance and security.
 *
 * Pros:
 * - AWS manages master keys (can't lose them)
 * - Automatic backups and redundancy
 * - Audit logs (CloudTrail)
 * - Key rotation support
 * - Multi-region replication available
 * - 99.999% uptime SLA
 *
 * Cons:
 * - Costs ~$1/month per key + $0.03 per 10K requests
 * - Network latency (~50-200ms per operation)
 * - Requires AWS account and credentials
 *
 * How it works (Envelope Encryption):
 * 1. Generate random Data Encryption Key (DEK) via KMS
 * 2. Encrypt file locally with DEK (fast, no network)
 * 3. Encrypt DEK with KMS master key (returns encrypted DEK)
 * 4. Store encrypted file + encrypted DEK
 * 5. To decrypt: Ask KMS to decrypt DEK, then decrypt file locally
 *
 * Master key never leaves AWS HSM!
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class KMSEncryptionService implements IEncryptionService {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor(config: KMSEncryptionConfig) {
    this.keyId = config.keyId;

    // Initialize KMS client
    this.kmsClient = new KMSClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: config.credentials
        ? {
            accessKeyId: config.credentials.accessKeyId,
            secretAccessKey: config.credentials.secretAccessKey,
          }
        : undefined, // Uses default AWS credential chain if not provided
    });
  }

  /**
   * Encrypt data using AWS KMS envelope encryption
   */
  async encrypt(data: Buffer): Promise<EncryptionResult> {
    try {
      // Step 1: Generate Data Encryption Key (DEK) from KMS
      const generateKeyCommand = new GenerateDataKeyCommand({
        KeyId: this.keyId,
        KeySpec: 'AES_256', // 256-bit key
      });

      const generateKeyResponse = await this.kmsClient.send(generateKeyCommand);

      if (!generateKeyResponse.Plaintext || !generateKeyResponse.CiphertextBlob) {
        throw new Error('KMS GenerateDataKey failed: missing Plaintext or CiphertextBlob');
      }

      // DEK in plaintext (will be zeroed out after use)
      const dek = Buffer.from(generateKeyResponse.Plaintext);

      // DEK encrypted by KMS master key (safe to store)
      const encryptedDek = Buffer.from(generateKeyResponse.CiphertextBlob);

      // Step 2: Encrypt data locally with DEK (fast, no network call)
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);

      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Step 3: Zero out plaintext DEK from memory (security best practice)
      dek.fill(0);

      // Step 4: Combine IV + AuthTag + EncryptedData
      const encryptedData = Buffer.concat([iv, authTag, encrypted]);

      // Step 5: Return encrypted data + metadata (includes encrypted DEK)
      const metadata: EncryptionMetadata = {
        provider: 'kms',
        keyId: this.keyId,
        encryptedDek: encryptedDek.toString('base64'),
        encryptedAt: new Date().toISOString(),
      };

      return { encryptedData, metadata };
    } catch (error: any) {
      throw new Error(`KMS encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with KMS
   */
  async decrypt(
    encryptedData: Buffer,
    metadata: EncryptionMetadata
  ): Promise<Buffer> {
    // Validate provider
    if (metadata.provider !== 'kms') {
      throw new Error(
        `Cannot decrypt with KMSEncryptionService: data was encrypted with '${metadata.provider}' provider`
      );
    }

    if (!metadata.encryptedDek) {
      throw new Error('Missing encryptedDek in metadata (required for KMS decryption)');
    }

    try {
      // Step 1: Ask KMS to decrypt the DEK
      const decryptCommand = new DecryptCommand({
        CiphertextBlob: Buffer.from(metadata.encryptedDek, 'base64'),
        KeyId: metadata.keyId, // Optional, KMS can infer from ciphertext
      });

      const decryptResponse = await this.kmsClient.send(decryptCommand);

      if (!decryptResponse.Plaintext) {
        throw new Error('KMS Decrypt failed: missing Plaintext');
      }

      const dek = Buffer.from(decryptResponse.Plaintext);

      // Step 2: Validate encrypted data length
      if (encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Invalid encrypted data: too short');
      }

      // Step 3: Extract components
      const iv = encryptedData.subarray(0, IV_LENGTH);
      const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      // Step 4: Decrypt data locally with DEK
      const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Step 5: Zero out DEK from memory
      dek.fill(0);

      return decrypted;
    } catch (error: any) {
      throw new Error(`KMS decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt text string (convenience method)
   */
  async encryptText(text: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf8');
    const result = await this.encrypt(buffer);

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
  getProvider(): 'kms' {
    return 'kms';
  }
}
