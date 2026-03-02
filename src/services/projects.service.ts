import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ListProjectsQuery,
} from '@/types/time-tracker.types';

const BASE_URL = '/projects';

export const projectsService = {
  /**
   * Create a new project
   */
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Get list of projects with filters
   */
  async list(params: ListProjectsQuery): Promise<PaginatedResponse<Project>> {
    const response = await api.get<PaginatedResponse<Project>>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Update project
   */
  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await api.patch<ApiResponse<Project>>(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
