import api from '@/lib/axios';
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

export const usersService = {
  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async updatePassword(id: string, data: UpdatePasswordData): Promise<void> {
    await api.patch(`/users/${id}/password`, data);
  },
};
