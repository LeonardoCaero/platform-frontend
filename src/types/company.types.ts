export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string;
  status: CompanyStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: {
    memberships: number;
    roles: number;
  };
}

export interface CompanyRole {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    companyMembers: number;
  };
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  status: MemberStatus;
  position?: string;
  department?: string;
  invitedAt: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  roles: CompanyRole[];
}

export interface CreateCompanyDto {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCompanyDto {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  status?: CompanyStatus;
  metadata?: Record<string, any>;
}

export interface InviteMemberDto {
  userId: string;
  position?: string;
  department?: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface CreateCompanyRoleDto {
  name: string;
  description?: string;
  color?: string;
}

export interface CompaniesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus | 'ALL';
  includeDeleted?: boolean;
}

export interface PaginatedCompaniesResponse {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SlugAvailabilityResponse {
  available: boolean;
  slug: string;
}
