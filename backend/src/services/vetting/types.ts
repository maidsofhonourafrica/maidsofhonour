// Vetting System Types

export interface SmileIDKYCRequest {
  userId: string;
  jobId?: string;
  idInfo: {
    country: string;
    idType: string;
    idNumber: string;
    entered: boolean;
  };
  consentInformation?: {
    consentGrantedDate: string;
    personalDetailsConsentGranted: boolean;
    contactInfoConsentGranted: boolean;
    documentInfoConsentGranted: boolean;
  };
  useStrictMode?: boolean;
  callbackUrl?: string;
}

export interface SmileIDKYCResult {
  success: boolean;
  jobId: string;
  userId: string;
  code: string;
  message: string;
  resultCode?: string;
  resultText?: string;
  actions?: Record<string, string>;
  matchedFields?: Record<string, string>;
  selfieImage?: string;
  livenessImages?: string[];
  idDocumentImages?: string[];
  timestamp?: string;
}

export interface PhoneVerificationRequest {
  country: string;
  phoneNumber: string;
  matchFields: {
    firstName: string;
    lastName: string;
    otherName?: string;
    idNumber?: string;
  };
  operator?: string;
  callbackUrl?: string;
}

export interface PhoneVerificationResult {
  success: boolean;
  code: string;
  message: string;
  jobId?: string;
  jobType: string;
  matchedFields?: Record<string, string>;
  timestamp?: string;
}

export interface DocumentUploadRequest {
  serviceProviderId: string;
  documentType: 'pcc' | 'medical_certificate' | 'national_id' | 'passport' | 'educational_certificate' | 'reference_letter' | 'first_aid_cert' | 'baby_care_cert' | 'other';
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issuedDate?: string;
  expiryDate?: string;
  encrypt: boolean;
}

export interface VideoUploadRequest {
  serviceProviderId: string;
  videoType: 'self_introduction' | 'work_experience' | 'skills_demo' | 'other';
  videoKey: string;
  durationSeconds?: number;
  fileSize: number;
  encrypt: boolean;
}

export type VettingStepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';
export type VettingStatus = 'incomplete' | 'documents_pending' | 'ai_interview_pending' | 'employer_verification_pending' | 'manual_review_pending' | 'approved' | 'rejected';

export interface VettingProgress {
  id: string;
  serviceProviderId: string;
  vettingStepId: string;
  status: VettingStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  resultData?: Record<string, any>;
  aiAssessment?: string;
  flagged: boolean;
  flaggedReason?: string;
  adminReviewed: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface SPProfileSetupRequest {
  serviceProviderId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  county: string;
  subCounty?: string;
  ward?: string;
  specificLocation?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  yearsOfExperience?: number;
  languagesSpoken?: string[];
  educationLevel?: string;
  willingToRelocate: boolean;
  preferredWorkType?: 'live_in' | 'live_out' | 'both';
  childrenCount?: number;
  maritalStatus?: string;
  socialMediaLinks?: Record<string, string>;
  externalCertifications?: Array<{ name: string; issuer: string; year: number }>;
  skills: Array<{
    categoryId: string;
    experienceYears?: number;
    proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
    certified: boolean;
  }>;
  smsNotificationsConsent: boolean;
}
