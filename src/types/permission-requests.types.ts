// Permission Request Types
export enum PermissionRequestType {
  GLOBAL_PERMISSION = 'GLOBAL_PERMISSION',
  OTHER = 'OTHER',
}

export enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface Permission {
  id: string;
  key: string;
  description?: string | null;
  scope: 'GLOBAL' | 'COMPANY';
}

export interface PermissionRequest {
  id: string;
  userId: string;
  type: PermissionRequestType;
  status: PermissionRequestStatus;
  requestedPermissionId?: string | null;
  requestedPermission?: Permission | null;
  reason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatar?: string | null;
  };
  reviewer?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
}

export interface CreatePermissionRequestDto {
  type?: PermissionRequestType;
  requestedPermissionId?: string;
  reason?: string;
}

export interface UpdatePermissionRequestDto {
  reason?: string;
}

export interface ReviewPermissionRequestDto {
  action: 'approve' | 'reject';
  reviewNotes?: string;
}

export interface PermissionRequestsListParams {
  page?: number;
  limit?: number;
  status?: PermissionRequestStatus | 'ALL';
  type?: PermissionRequestType;
}

export interface PaginatedPermissionRequestsResponse {
  data: PermissionRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type { ApiResponse } from '@/types/api.types';
