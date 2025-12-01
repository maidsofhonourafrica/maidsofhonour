/**
 * Encryption Service Types
 *
 * Provides unified interface for different encryption providers:
 * - Local AES-256-GCM (for development/testing)
 * - AWS KMS (for production)
 */

/**
 * Encryption result containing encrypted data and provider-specific metadata
 */
export interface EncryptionResult {
  /** Encrypted data as buffer */
  encryptedData: Buffer;

  /** Provider-specific metadata needed for decryption */
  metadata: EncryptionMetadata;
}

/**
 * Metadata stored alongside encrypted data
 * Allows decryption regardless of provider
 */
export interface EncryptionMetadata {
  /** Encryption provider used */
  provider: 'local' | 'kms';

  /** Algorithm used (for local provider) */
  algorithm?: 'aes-256-gcm';

  /** AWS KMS Key ID (for KMS provider) */
  keyId?: string;

  /** Encrypted data encryption key (for KMS provider) */
  encryptedDek?: string;

  /** Timestamp when encrypted */
  encryptedAt: string;
}

/**
 * Abstract encryption service interface
 * All providers must implement this contract
 */
export interface IEncryptionService {
  /**
   * Encrypt data and return encrypted buffer with metadata
   *
   * @param data - Plaintext data to encrypt
   * @returns Encrypted data and metadata needed for decryption
   */
  encrypt(data: Buffer): Promise<EncryptionResult>;

  /**
   * Decrypt data using provided metadata
   *
   * @param encryptedData - Encrypted data buffer
   * @param metadata - Metadata from original encryption
   * @returns Decrypted plaintext data
   * @throws Error if decryption fails (corrupted data, wrong key, etc.)
   */
  decrypt(encryptedData: Buffer, metadata: EncryptionMetadata): Promise<Buffer>;

  /**
   * Encrypt text (convenience method)
   *
   * @param text - Plaintext text to encrypt
   * @returns Base64-encoded encrypted data and metadata as JSON string
   */
  encryptText(text: string): Promise<string>;

  /**
   * Decrypt text (convenience method)
   *
   * @param encryptedText - JSON string containing encrypted data and metadata
   * @returns Decrypted plaintext text
   */
  decryptText(encryptedText: string): Promise<string>;

  /**
   * Get provider name
   */
  getProvider(): 'local' | 'kms';
}

/**
 * Configuration for local encryption provider
 */
export interface LocalEncryptionConfig {
  /** Master key (64 hex characters = 32 bytes) */
  masterKey: string;
}

/**
 * Configuration for AWS KMS encryption provider
 */
export interface KMSEncryptionConfig {
  /** AWS KMS Key ID or ARN */
  keyId: string;

  /** AWS region (optional, defaults to AWS_REGION env var) */
  region?: string;

  /** AWS credentials (optional, uses default credential chain if not provided) */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}
