import api from '@/lib/axios';
import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionsListParams,
  PaginatedPermissionsResponse,
  ApiResponse,
} from '@/types/permission.types';

const BASE_URL = '/permissions';

export const permissionsService = {
  /**
   * Get paginated list of permissions
   */
  async getPermissions(params: PermissionsListParams = {}): Promise<PaginatedPermissionsResponse> {
    const { data } = await api.get<PaginatedPermissionsResponse>(BASE_URL, { params });
    return data;
  },

  /**
   * Get all permissions (no pagination)
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data } = await api.get<ApiResponse<Permission[]>>(`${BASE_URL}/all`);
    return data.data;
  },

  /**
   * Get single permission by ID
   */
  async getPermissionById(id: string): Promise<Permission> {
    const { data } = await api.get<ApiResponse<Permission>>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Create new permission
   */
  async createPermission(permissionData: CreatePermissionDto): Promise<Permission> {
    const { data } = await api.post<ApiResponse<Permission>>(BASE_URL, permissionData);
    return data.data;
  },

  /**
   * Update permission
   */
  async updatePermission(id: string, permissionData: UpdatePermissionDto): Promise<Permission> {
    const { data } = await api.patch<ApiResponse<Permission>>(`${BASE_URL}/${id}`, permissionData);
    return data.data;
  },

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
