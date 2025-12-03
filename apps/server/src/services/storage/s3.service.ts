import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { getEncryptionService } from '../encryption';
import type { EncryptionResult } from '../encryption/types';

export interface S3UploadOptions {
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
  folder?: string; // Optional folder prefix (e.g., 'kyc-documents', 'profile-photos')
  encrypt?: boolean; // Whether to encrypt file before uploading
  metadata?: Record<string, string>; // Custom metadata
}

export interface S3UploadResult {
  key: string; // S3 object key (full path)
  bucket: string;
  url: string; // S3 URL
  size: number; // File size in bytes
  contentType: string;
  encrypted: boolean;
  encryptionMetadata?: EncryptionResult['metadata']; // Encryption details if encrypted
}

export interface S3DownloadResult {
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

/**
 * S3 Storage Service
 *
 * Handles file uploads/downloads to AWS S3 with optional encryption.
 * Integrates with the encryption service for transparent encryption/decryption.
 *
 * Features:
 * - Upload files with optional encryption
 * - Download files with automatic decryption
 * - Generate presigned URLs for temporary access
 * - List, delete, and check file existence
 * - Multipart uploads for large files (>5MB)
 */
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    // Support MinIO for local development
    const endpoint = process.env.AWS_S3_ENDPOINT; // e.g., http://localhost:9000
    const forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === 'true'; // MinIO requires path-style

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      ...(endpoint && { endpoint }), // Custom endpoint for MinIO
      forcePathStyle, // Required for MinIO (http://localhost:9000/bucket/key instead of http://bucket.localhost:9000/key)
    });
  }

  /**
   * Upload a file to S3 with optional encryption
   */
  async uploadFile(options: S3UploadOptions): Promise<S3UploadResult> {
    const { fileName, fileBuffer, contentType, folder, encrypt = false, metadata = {} } = options;

    // Generate S3 key (path)
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = folder
      ? `${folder}/${timestamp}-${sanitizedFileName}`
      : `${timestamp}-${sanitizedFileName}`;

    let finalBuffer = fileBuffer;
    let finalMetadata = { ...metadata };
    let encryptionMetadata: EncryptionResult['metadata'] | undefined;

    // Encrypt file if requested
    if (encrypt) {
      const encryptionService = getEncryptionService();
      const encryptionResult = await encryptionService.encrypt(fileBuffer);

      finalBuffer = encryptionResult.encryptedData;
      encryptionMetadata = encryptionResult.metadata;

      // Store encryption metadata in S3 object metadata
      finalMetadata = {
        ...finalMetadata,
        encrypted: 'true',
        encryptionProvider: encryptionMetadata.provider,
        encryptedAt: encryptionMetadata.encryptedAt,
      };

      // For KMS, store encrypted DEK in metadata
      if (encryptionMetadata.provider === 'kms' && encryptionMetadata.encryptedDek) {
        finalMetadata.encryptedDek = encryptionMetadata.encryptedDek;
        finalMetadata.keyId = encryptionMetadata.keyId || '';
      }

      // For local, store algorithm in metadata
      if (encryptionMetadata.provider === 'local' && encryptionMetadata.algorithm) {
        finalMetadata.algorithm = encryptionMetadata.algorithm;
      }
    }

    // Use multipart upload for files > 5MB for better performance
    if (finalBuffer.length > 5 * 1024 * 1024) {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: finalBuffer,
          ContentType: contentType,
          Metadata: finalMetadata,
          ServerSideEncryption: 'AES256', // Server-side encryption at rest
        },
      });

      await upload.done();
    } else {
      // Single-part upload for smaller files
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: finalBuffer,
        ContentType: contentType,
        Metadata: finalMetadata,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
    }

    return {
      key,
      bucket: this.bucket,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      size: finalBuffer.length,
      contentType,
      encrypted: encrypt,
      encryptionMetadata,
    };
  }

  /**
   * Download a file from S3 with automatic decryption
   */
  async downloadFile(key: string): Promise<S3DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as Readable;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    let buffer = Buffer.concat(chunks);
    const metadata = response.Metadata || {};

    // Decrypt if file was encrypted
    if (metadata.encrypted === 'true') {
      const encryptionService = getEncryptionService();

      // Reconstruct encryption metadata from S3 metadata
      const encryptionMetadata: EncryptionResult['metadata'] = {
        provider: metadata.encryptionProvider as 'local' | 'kms',
        encryptedAt: metadata.encryptedAt || new Date().toISOString(),
      };

      if (metadata.encryptionProvider === 'kms') {
        encryptionMetadata.keyId = metadata.keyId;
        encryptionMetadata.encryptedDek = metadata.encryptedDek;
      }

      if (metadata.encryptionProvider === 'local') {
        encryptionMetadata.algorithm = metadata.algorithm as 'aes-256-gcm';
      }

      // Decrypt the file
      // Decrypt the file
      buffer = await encryptionService.decrypt(
        buffer as any,
        encryptionMetadata
      ) as any;
    }

    return {
      buffer,
      contentType: response.ContentType || 'application/octet-stream',
      metadata,
    };
  }

  /**
   * Generate a presigned URL for temporary file access
   *
   * @param key - S3 object key
   * @param expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files in a folder (prefix)
   */
  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<S3FileInfo[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);
    const files: S3FileInfo[] = [];

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          files.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          });
        }
      }
    }

    return files;
  }

  /**
   * Get file metadata without downloading
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata: Record<string, string>;
  }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    };
  }
}

// Singleton instance
let s3ServiceInstance: S3Service | null = null;

/**
 * Get or create S3Service singleton instance
 */
export function getS3Service(): S3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
}
