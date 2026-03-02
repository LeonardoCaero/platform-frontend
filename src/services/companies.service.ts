import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  CompaniesListParams,
  PaginatedCompaniesResponse,
  SlugAvailabilityResponse,
} from '@/types/company.types';

const BASE_URL = '/companies';

export const companiesService = {
  /**
   * Get paginated list of companies
   */
  async getCompanies(params: CompaniesListParams = {}): Promise<PaginatedCompaniesResponse> {
    const queryParams: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status !== 'ALL' ? params.status : undefined,
    };
    
    if (params.includeDeleted === true) {
      queryParams.includeDeleted = true;
    }
    
    const { data } = await api.get<PaginatedCompaniesResponse>(BASE_URL, { params: queryParams });
    return data;
  },

  /**
   * Get single company by ID
   */
  async getCompanyById(id: string): Promise<Company> {
    const { data } = await api.get<ApiResponse<Company>>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Get company by slug
   */
  async getCompanyBySlug(slug: string): Promise<Company> {
    const { data } = await api.get<ApiResponse<Company>>(`${BASE_URL}/slug/${slug}`);
    return data.data;
  },

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(slug: string): Promise<SlugAvailabilityResponse> {
    const { data } = await api.get<ApiResponse<SlugAvailabilityResponse>>(`${BASE_URL}/slug/check/${slug}`);
    return data.data;
  },

  /**
   * Create new company
   */
  async createCompany(companyData: CreateCompanyDto): Promise<Company> {
    const { data } = await api.post<ApiResponse<Company>>(BASE_URL, companyData);
    return data.data;
  },

  /**
   * Update company
   */
  async updateCompany(id: string, companyData: UpdateCompanyDto): Promise<Company> {
    const { data } = await api.patch<ApiResponse<Company>>(`${BASE_URL}/${id}`, companyData);
    return data.data;
  },

  /**
   * Soft delete company
   */
  async deleteCompany(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Restore deleted company
   */
  async restoreCompany(id: string): Promise<Company> {
    const { data } = await api.post<ApiResponse<Company>>(`${BASE_URL}/${id}/restore`);
    return data.data;
  },

  /**
   * Generate slug from company name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};
