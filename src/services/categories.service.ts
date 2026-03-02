import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { TimeEntryCategory, CreateCategoryDto, UpdateCategoryDto } from '@/types/clients.types';

const BASE = '/time-entry-categories';

export const categoriesService = {
  async list(params: { companyId: string; isActive?: boolean }): Promise<TimeEntryCategory[]> {
    const res = await api.get<ApiResponse<TimeEntryCategory[]>>(BASE, { params });
    return res.data.data;
  },

  async create(data: CreateCategoryDto): Promise<TimeEntryCategory> {
    const res = await api.post<ApiResponse<TimeEntryCategory>>(BASE, data);
    return res.data.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<TimeEntryCategory> {
    const res = await api.patch<ApiResponse<TimeEntryCategory>>(`${BASE}/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
};
