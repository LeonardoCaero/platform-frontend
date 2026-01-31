import api from '@/lib/axios';

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryData {
  date: string;
  hours: number;
  description: string;
}

export interface UpdateTimeEntryData {
  date?: string;
  hours?: number;
  description?: string;
}

export interface TimeEntriesParams {
  startDate?: string;
  endDate?: string;
}

export const timeEntriesService = {
  async create(data: CreateTimeEntryData): Promise<TimeEntry> {
    const response = await api.post<TimeEntry>('/time-entries', data);
    return response.data;
  },

  async list(params?: TimeEntriesParams): Promise<TimeEntry[]> {
    const response = await api.get<TimeEntry[]>('/time-entries', { params });
    return response.data;
  },

  async update(id: string, data: UpdateTimeEntryData): Promise<TimeEntry> {
    const response = await api.patch<TimeEntry>(`/time-entries/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/time-entries/${id}`);
  },
};
