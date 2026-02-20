export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  COMPANY = 'COMPANY',
}

export interface Permission {
  id: string;
  key: string;
  description?: string | null;
  scope: PermissionScope;
  _count?: {
    roles: number;
    userGlobalPermissions: number;
  };
}

export interface CreatePermissionDto {
  key: string;
  description?: string;
  scope?: PermissionScope;
}

export interface UpdatePermissionDto {
  key?: string;
  description?: string;
  scope?: PermissionScope;
}

export interface PermissionsListParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: PermissionScope;
}

export interface PaginatedPermissionsResponse {
  success: boolean;
  data: Permission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
