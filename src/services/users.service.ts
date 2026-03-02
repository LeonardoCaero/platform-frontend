import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import { User } from './auth.service';

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export const usersService = {
  async getUser(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async listUsers(search?: string, limit = 20): Promise<PlatformUser[]> {
    const params: Record<string, any> = { limit };
    if (search) params.search = search;
    const { data } = await api.get<{ data: PlatformUser[] }>('/users', { params });
    return data.data ?? [];
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  async updatePassword(id: string, data: UpdatePasswordData): Promise<void> {
    await api.patch(`/users/${id}/password`, data);
  },
};
