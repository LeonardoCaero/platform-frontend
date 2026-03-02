export enum CompanyRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CompanyRequest {
  id: string;
  companyName: string;
  companySlug: string;
  description?: string;
  reason?: string;
  status: CompanyRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface CreateCompanyRequestDto {
  companyName: string;
  companySlug: string;
  description?: string;
  reason?: string;
}

export interface UpdateCompanyRequestDto {
  companyName?: string;
  companySlug?: string;
  description?: string;
  reason?: string;
}

export interface ReviewCompanyRequestDto {
  action: 'approve' | 'reject';
  reviewNotes?: string;
}

export interface CompanyRequestsListParams {
  status?: CompanyRequestStatus | 'ALL';
  page?: number;
  limit?: number;
}

export interface PaginatedCompanyRequestsResponse {
  success: boolean;
  data: CompanyRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type { ApiResponse } from '@/types/api.types';
