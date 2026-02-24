import api from '@/lib/axios';
import type {
  Client,
  ClientSite,
  ClientRateRule,
  ClientRateRuleResource,
  CreateClientDto,
  UpdateClientDto,
  CreateClientSiteDto,
  UpdateClientSiteDto,
  CreateClientRateRuleDto,
  UpdateClientRateRuleDto,
  CreateClientRateRuleResourceDto,
  UpdateClientRateRuleResourceDto,
} from '@/types/clients.types';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }
interface PaginatedResponse<T> { success: boolean; data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; }

const BASE = '/clients';

export const clientsService = {
  // ── Clients ───────────────────────────────────────────────────────────────
  async list(params: { companyId: string; isActive?: boolean; page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Client>> {
    const res = await api.get<PaginatedResponse<Client>>(BASE, { params });
    return res.data;
  },

  async getById(id: string): Promise<Client> {
    const res = await api.get<ApiResponse<Client>>(`${BASE}/${id}`);
    return res.data.data;
  },

  async create(data: CreateClientDto): Promise<Client> {
    const res = await api.post<ApiResponse<Client>>(BASE, data);
    return res.data.data;
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const res = await api.patch<ApiResponse<Client>>(`${BASE}/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  // ── Sites ──────────────────────────────────────────────────────────────────
  async createSite(clientId: string, data: CreateClientSiteDto): Promise<ClientSite> {
    const res = await api.post<ApiResponse<ClientSite>>(`${BASE}/${clientId}/sites`, data);
    return res.data.data;
  },

  async updateSite(siteId: string, data: UpdateClientSiteDto): Promise<ClientSite> {
    const res = await api.patch<ApiResponse<ClientSite>>(`${BASE}/sites/${siteId}`, data);
    return res.data.data;
  },

  async deleteSite(siteId: string): Promise<void> {
    await api.delete(`${BASE}/sites/${siteId}`);
  },

  // ── Rate Rules ────────────────────────────────────────────────────────────
  async createRateRule(clientId: string, data: CreateClientRateRuleDto): Promise<ClientRateRule> {
    const res = await api.post<ApiResponse<ClientRateRule>>(`${BASE}/${clientId}/rates`, data);
    return res.data.data;
  },

  async updateRateRule(ruleId: string, data: UpdateClientRateRuleDto): Promise<ClientRateRule> {
    const res = await api.patch<ApiResponse<ClientRateRule>>(`${BASE}/rates/${ruleId}`, data);
    return res.data.data;
  },

  async deleteRateRule(ruleId: string): Promise<void> {
    await api.delete(`${BASE}/rates/${ruleId}`);
  },

  // ── Resources ──────────────────────────────────────────────────────────
  async createResource(ruleId: string, data: CreateClientRateRuleResourceDto): Promise<ClientRateRuleResource> {
    const res = await api.post<ApiResponse<ClientRateRuleResource>>(`${BASE}/rates/${ruleId}/resources`, data);
    return res.data.data;
  },

  async updateResource(resourceId: string, data: UpdateClientRateRuleResourceDto): Promise<ClientRateRuleResource> {
    const res = await api.patch<ApiResponse<ClientRateRuleResource>>(`${BASE}/resources/${resourceId}`, data);
    return res.data.data;
  },

  async deleteResource(resourceId: string): Promise<void> {
    await api.delete(`${BASE}/resources/${resourceId}`);
  },
};
