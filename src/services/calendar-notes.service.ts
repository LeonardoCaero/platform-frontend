import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  CalendarNote,
  CreateCalendarNoteDto,
  UpdateCalendarNoteDto,
  ListCalendarNotesQuery,
} from '@/types/calendar.types';

const BASE_URL = '/calendar-notes';

export const calendarNotesService = {
  async create(data: CreateCalendarNoteDto): Promise<CalendarNote> {
    const response = await api.post<ApiResponse<CalendarNote>>(BASE_URL, data);
    return response.data.data;
  },

  async list(params: ListCalendarNotesQuery): Promise<CalendarNote[]> {
    const response = await api.get<ApiResponse<CalendarNote[]>>(BASE_URL, { params });
    return response.data.data;
  },

  async getById(id: string): Promise<CalendarNote> {
    const response = await api.get<ApiResponse<CalendarNote>>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  async update(id: string, data: UpdateCalendarNoteDto): Promise<CalendarNote> {
    const response = await api.patch<ApiResponse<CalendarNote>>(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
