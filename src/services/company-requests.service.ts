import api from '@/lib/axios';
import {
  CompanyRequest,
  CreateCompanyRequestDto,
  UpdateCompanyRequestDto,
  ReviewCompanyRequestDto,
  CompanyRequestsListParams,
  PaginatedCompanyRequestsResponse,
  ApiResponse,
} from '@/types/company-requests.types';

const BASE_URL = '/company-requests';

export const companyRequestsService = {
  /**
   * Get user's company requests (paginated)
   */
  async getMyRequests(params: CompanyRequestsListParams = {}): Promise<PaginatedCompanyRequestsResponse> {
    const { data } = await api.get<PaginatedCompanyRequestsResponse>(BASE_URL, { params });
    return data;
  },

  /**
   * Get single company request by ID
   */
  async getRequestById(id: string): Promise<CompanyRequest> {
    const { data } = await api.get<ApiResponse<CompanyRequest>>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Create new company request
   */
  async createRequest(requestData: CreateCompanyRequestDto): Promise<CompanyRequest> {
    const { data } = await api.post<ApiResponse<CompanyRequest>>(BASE_URL, requestData);
    return data.data;
  },

  /**
   * Update pending company request
   */
  async updateRequest(id: string, requestData: UpdateCompanyRequestDto): Promise<CompanyRequest> {
    const { data } = await api.patch<ApiResponse<CompanyRequest>>(`${BASE_URL}/${id}`, requestData);
    return data.data;
  },

  /**
   * Cancel pending company request
   */
  async cancelRequest(id: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/cancel`);
  },

  /**
   * Admin: Get all company requests (paginated)
   */
  async adminGetAllRequests(params: CompanyRequestsListParams = {}): Promise<PaginatedCompanyRequestsResponse> {
    const { data } = await api.get<PaginatedCompanyRequestsResponse>(`${BASE_URL}/admin/company-requests`, { params });
    return data;
  },

  /**
   * Admin: Review company request (approve/reject)
   */
  async adminReviewRequest(id: string, reviewData: ReviewCompanyRequestDto): Promise<CompanyRequest> {
    const { data } = await api.post<ApiResponse<CompanyRequest>>(
      `${BASE_URL}/admin/company-requests/${id}/review`,
      reviewData
    );
    return data.data;
  },
};
