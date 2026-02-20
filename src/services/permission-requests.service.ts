import api from '@/lib/axios';
import {
  PermissionRequest,
  CreatePermissionRequestDto,
  UpdatePermissionRequestDto,
  ReviewPermissionRequestDto,
  PermissionRequestsListParams,
  PaginatedPermissionRequestsResponse,
  ApiResponse,
  Permission,
} from '@/types/permission-requests.types';

const BASE_URL = '/permission-requests';

export const permissionRequestsService = {
  /**
   * Get available global permissions that can be requested
   */
  async getAvailablePermissions(): Promise<Permission[]> {
    const { data } = await api.get<ApiResponse<Permission[]>>(`${BASE_URL}/available-permissions`);
    return data.data;
  },

  /**
   * Get user's permission requests (paginated)
   */
  async getMyRequests(params: PermissionRequestsListParams = {}): Promise<PaginatedPermissionRequestsResponse> {
    const { data } = await api.get<PaginatedPermissionRequestsResponse>(BASE_URL, { params });
    return data;
  },

  /**
   * Get single permission request by ID
   */
  async getRequestById(id: string): Promise<PermissionRequest> {
    const { data } = await api.get<ApiResponse<PermissionRequest>>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Create new permission request
   */
  async createRequest(requestData: CreatePermissionRequestDto): Promise<PermissionRequest> {
    const { data } = await api.post<ApiResponse<PermissionRequest>>(BASE_URL, requestData);
    return data.data;
  },

  /**
   * Update pending permission request
   */
  async updateRequest(id: string, requestData: UpdatePermissionRequestDto): Promise<PermissionRequest> {
    const { data } = await api.patch<ApiResponse<PermissionRequest>>(`${BASE_URL}/${id}`, requestData);
    return data.data;
  },

  /**
   * Cancel pending permission request
   */
  async cancelRequest(id: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/cancel`);
  },

  /**
   * Admin: Get all permission requests (paginated)
   */
  async adminGetAllRequests(params: PermissionRequestsListParams = {}): Promise<PaginatedPermissionRequestsResponse> {
    const { data } = await api.get<PaginatedPermissionRequestsResponse>(`${BASE_URL}/admin/all`, { params });
    return data;
  },

  /**
   * Admin: Review permission request (approve/reject)
   */
  async adminReviewRequest(id: string, reviewData: ReviewPermissionRequestDto): Promise<PermissionRequest> {
    const { data } = await api.post<ApiResponse<PermissionRequest>>(
      `${BASE_URL}/admin/${id}/review`,
      reviewData
    );
    return data.data;
  },
};
