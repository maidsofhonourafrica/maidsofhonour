/**
 * File Upload Types and Constants
 */

/**
 * S3 folder structure
 */
export const S3_FOLDERS = {
  // KYC Documents (encrypted)
  KYC_DOCUMENTS: 'kyc-documents',
  PCC: 'kyc-documents/pcc',
  NATIONAL_ID: 'kyc-documents/national-id',
  MEDICAL_CERTIFICATES: 'kyc-documents/medical',
  EDUCATIONAL_CERTIFICATES: 'kyc-documents/education',
  REFERENCE_LETTERS: 'kyc-documents/references',

  // Profile media
  PROFILE_PHOTOS: 'profile-photos',
  VIDEO_INTRODUCTIONS: 'video-introductions',
  VIDEO_INTERVIEWS: 'video-interviews',

  // Placements & Contracts
  CONTRACTS: 'contracts',
  ISSUE_EVIDENCE: 'issue-evidence',

  // Certifications
  CERTIFICATES: 'certificates',

  // Training
  TRAINING_VIDEOS: 'training/videos',
  TRAINING_MATERIALS: 'training/materials',
} as const;

export type S3Folder = (typeof S3_FOLDERS)[keyof typeof S3_FOLDERS];

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  VIDEOS: ['video/mp4', 'video/quicktime', 'video/webm'],
  ALL_DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
} as const;

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  PROFILE_PHOTO: 5 * 1024 * 1024, // 5 MB
  KYC_DOCUMENT: 10 * 1024 * 1024, // 10 MB
  VIDEO_INTRO: 100 * 1024 * 1024, // 100 MB
  VIDEO_INTERVIEW: 200 * 1024 * 1024, // 200 MB
  TRAINING_VIDEO: 500 * 1024 * 1024, // 500 MB
  CONTRACT: 5 * 1024 * 1024, // 5 MB
  CERTIFICATE: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * Document types that should be encrypted
 */
export const ENCRYPTED_DOCUMENT_TYPES = [
  S3_FOLDERS.PCC,
  S3_FOLDERS.NATIONAL_ID,
  S3_FOLDERS.MEDICAL_CERTIFICATES,
  S3_FOLDERS.REFERENCE_LETTERS,
] as const;

/**
 * Check if a file type is allowed
 */
export function isAllowedFileType(contentType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(contentType.toLowerCase());
}

/**
 * Check if file size is within limit
 */
export function isWithinSizeLimit(fileSize: number, limit: number): boolean {
  return fileSize <= limit;
}

/**
 * Check if a folder should have files encrypted
 */
export function shouldEncrypt(folder: string): boolean {
  return ENCRYPTED_DOCUMENT_TYPES.some((encryptedFolder) => folder.startsWith(encryptedFolder));
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  fileSize: number,
  contentType: string,
  allowedTypes: readonly string[],
  sizeLimit: number,
): FileValidationResult {
  // Check file type
  if (!isAllowedFileType(contentType, allowedTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (!isWithinSizeLimit(fileSize, sizeLimit)) {
    const limitMB = (sizeLimit / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds limit of ${limitMB} MB`,
    };
  }

  return { valid: true };
}
