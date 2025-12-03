/**
 * Document Upload Service
 *
 * Handles KYC document uploads for vetting process.
 * Thin wrapper around S3Service with document metadata tracking.
 */

import { db } from '../../db';
import { kycDocuments } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getS3Service } from '../storage/s3.service';
import type { S3UploadResult } from '../storage/s3.service';

export type DocumentType =
  | 'pcc'
  | 'medical_certificate'
  | 'national_id'
  | 'passport'
  | 'educational_certificate'
  | 'reference_letter'
  | 'first_aid_cert'
  | 'baby_care_cert'
  | 'other';

export interface DocumentUploadRequest {
  serviceProviderId: string;
  documentType: DocumentType;
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
  issuedDate?: Date;
  expiryDate?: Date;
}

export interface DocumentUploadResult {
  id: string;
  fileUrl: string;
  fileKey: string;
  documentType: DocumentType;
  verified: boolean;
  uploadedAt: Date;
}

export interface DocumentDownloadResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

// Documents that MUST be encrypted
const ENCRYPTED_DOCUMENT_TYPES: DocumentType[] = [
  'pcc',
  'medical_certificate',
  'national_id',
  'passport',
  'reference_letter',
];

/**
 * Document Upload Service
 */
export class DocumentUploadService {
  private s3Service = getS3Service();

  /**
   * Upload a KYC document
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResult> {
    const { serviceProviderId, documentType, file, issuedDate, expiryDate } = request;

    // Determine if document should be encrypted
    const shouldEncrypt = ENCRYPTED_DOCUMENT_TYPES.includes(documentType);

    // Upload to S3
    const uploadResult: S3UploadResult = await this.s3Service.uploadFile({
      fileName: file.originalName,
      fileBuffer: file.buffer,
      contentType: file.mimeType,
      folder: `kyc-documents/${serviceProviderId}`,
      encrypt: shouldEncrypt,
      metadata: {
        serviceProviderId,
        documentType,
      },
    });

    // Store metadata in database
    const [document] = await db
      .insert(kycDocuments)
      .values({
        serviceProviderId,
        documentType,
        fileUrl: uploadResult.url,
        fileKey: uploadResult.key,
        fileName: file.originalName,
        fileSize: uploadResult.size,
        mimeType: file.mimeType,
        verified: false,
        issuedDate: issuedDate || null,
        expiryDate: expiryDate || null,
        encryptionMetadata: uploadResult.encrypted ? uploadResult.encryptionMetadata : null,
        uploadedAt: new Date(),
        createdAt: new Date(),
      } as any)
      .returning();

    return {
      id: document.id,
      fileUrl: uploadResult.url,
      fileKey: uploadResult.key,
      documentType: document.documentType as DocumentType,
      verified: document.verified || false,
      uploadedAt: document.uploadedAt || new Date(),
    };
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<DocumentDownloadResult> {
    const [document] = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.id, documentId))
      .limit(1);

    if (!document) {
      throw new Error('Document not found');
    }

    // Download and decrypt from S3
    const downloadResult = await this.s3Service.downloadFile(document.fileKey);

    return {
      buffer: downloadResult.buffer,
      fileName: document.fileName || 'document',
      mimeType: document.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Get all documents for a service provider
   */
  async getDocumentsByServiceProvider(
    serviceProviderId: string,
    documentType?: DocumentType
  ): Promise<Array<{
    id: string;
    documentType: DocumentType;
    fileName: string;
    fileSize: number;
    mimeType: string;
    verified: boolean;
    verifiedAt: Date | null;
    uploadedAt: Date;
  }>> {
    const conditions = [eq(kycDocuments.serviceProviderId, serviceProviderId)];

    if (documentType) {
      conditions.push(eq(kycDocuments.documentType, documentType));
    }

    const documents = await db
      .select({
        id: kycDocuments.id,
        documentType: kycDocuments.documentType,
        fileName: kycDocuments.fileName,
        fileSize: kycDocuments.fileSize,
        mimeType: kycDocuments.mimeType,
        verified: kycDocuments.verified,
        verifiedAt: kycDocuments.verifiedAt,
        uploadedAt: kycDocuments.uploadedAt,
      })
      .from(kycDocuments)
      .where(and(...conditions));

    return documents as any;
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    const [document] = await db
      .select({ fileKey: kycDocuments.fileKey })
      .from(kycDocuments)
      .where(eq(kycDocuments.id, documentId))
      .limit(1);

    if (!document) {
      throw new Error('Document not found');
    }

    return this.s3Service.getPresignedUrl(document.fileKey, expiresIn);
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const [document] = await db
      .select({ fileKey: kycDocuments.fileKey })
      .from(kycDocuments)
      .where(eq(kycDocuments.id, documentId))
      .limit(1);

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(document.fileKey);

    // Delete from database
    await db.delete(kycDocuments).where(eq(kycDocuments.id, documentId));
  }

  /**
   * Verify a document (admin action)
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<void> {
    await db
      .update(kycDocuments)
      .set({
        verified: true,
        verifiedAt: new Date(),
        verifiedBy,
        verificationNotes: notes || null,
      })
      .where(eq(kycDocuments.id, documentId));
  }

  /**
   * Check if service provider has uploaded required documents
   */
  async hasRequiredDocuments(serviceProviderId: string): Promise<{
    hasAll: boolean;
    missing: DocumentType[];
    uploaded: DocumentType[];
  }> {
    const documents = await this.getDocumentsByServiceProvider(serviceProviderId);
    const uploadedTypes = new Set(documents.map((d) => d.documentType));

    // Required documents: PCC, National ID, Medical Certificate
    const requiredTypes: DocumentType[] = ['pcc', 'national_id', 'medical_certificate'];
    const missing = requiredTypes.filter((type) => !uploadedTypes.has(type));

    return {
      hasAll: missing.length === 0,
      missing,
      uploaded: Array.from(uploadedTypes) as DocumentType[],
    };
  }
}
