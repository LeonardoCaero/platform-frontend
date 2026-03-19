import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import { tokenStorage } from '@/lib/token-storage';

export interface Permission {
  key: string;
  description: string;
  grantedAt: string;
}

export interface CompanyRole {
  id: string;
  name: string;
  color?: string | null;
}

export interface CompanyMembership {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  membershipId: string;
  membershipStatus: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  roles: CompanyRole[];
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  isPlatformAdmin?: boolean;
  globalPermissions?: Permission[];
  companies?: CompanyMembership[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    await api.post('/auth/logout', { refreshToken });
    tokenStorage.clear();
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

};
