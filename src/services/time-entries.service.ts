import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  TimeEntry,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  ListTimeEntriesQuery,
  TimeEntrySummary,
} from '@/types/time-tracker.types';

const BASE_URL = '/time-entries';

export const timeEntriesService = {
  /**
   * Create a new time entry
   */
  async create(data: CreateTimeEntryDto): Promise<TimeEntry> {
    const response = await api.post<ApiResponse<TimeEntry>>(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Get list of time entries with filters
   */
  async list(params?: ListTimeEntriesQuery): Promise<PaginatedResponse<TimeEntry>> {
    const response = await api.get<PaginatedResponse<TimeEntry>>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get time entry by ID
   */
  async getById(id: string): Promise<TimeEntry> {
    const response = await api.get<ApiResponse<TimeEntry>>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Update time entry
   */
  async update(id: string, data: UpdateTimeEntryDto): Promise<TimeEntry> {
    const response = await api.patch<ApiResponse<TimeEntry>>(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete time entry
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Get time summary for current user
   */
  async getSummary(companyId: string, startDate: string, endDate: string): Promise<TimeEntrySummary> {
    const response = await api.get<ApiResponse<TimeEntrySummary>>(`${BASE_URL}/summary`, {
      params: { companyId, startDate, endDate },
    });
    return response.data.data;
  },
};

