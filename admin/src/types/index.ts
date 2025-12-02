// Core user types
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  userType: 'client' | 'service_provider' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
}

// Service Provider types
export interface ServiceProvider {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  nationalId: string;
  county: string;
  phoneNumber?: string;
  email?: string;
  bio?: string;
  vettingStatus: 'incomplete' | 'documents_pending' | 'ai_interview_pending' | 'employer_verification_pending' | 'manual_review_pending' | 'approved' | 'rejected';
  profilePhotoUrl?: string;
  videoIntroUrl?: string;
  averageRating?: number;
  totalRatings: number;
  availableForPlacement: boolean;
  currentlyPlaced: boolean;
  createdAt: string;
  updatedAt: string;
}

// Client types
export interface Client {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  county: string;
  phoneNumber?: string;
  email?: string;
  totalPlacements: number;
  activePlacements: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

// Placement types
export interface Placement {
  id: string;
  clientId: string;
  serviceProviderId?: string;
  placementType: 'one_off' | 'live_in';
  status: 'ai_search' | 'pending_sp_acceptance' | 'accepted' | 'payment_pending' | 'payment_received' | 'final_vetting' | 'in_progress' | 'completed' |'cancelled' | 'disputed';
  totalFee: number;
  platformCommission?: number;
  spPayout?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}
