import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import {
  CompanyMember,
  InviteMemberDto,
  CompanyRole,
  CreateCompanyRoleDto,
  UserSearchResult,
} from '@/types/company.types';

export const companyMembersService = {
  /**
   * Get all members of a company
   */
  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const { data } = await api.get<ApiResponse<CompanyMember[]>>(`/companies/${companyId}/members`);
    return data.data ?? [];
  },

  /**
   * Search platform users who are NOT yet members of this company
   */
  async searchNonMembers(companyId: string, search?: string): Promise<UserSearchResult[]> {
    const params = search ? { search } : {};
    const { data } = await api.get<ApiResponse<UserSearchResult[]>>(`/companies/${companyId}/non-members`, { params });
    return data.data ?? [];
  },

  /**
   * Invite a new member to company
   */
  async inviteMember(companyId: string, memberData: InviteMemberDto): Promise<CompanyMember> {
    const { data } = await api.post<ApiResponse<CompanyMember>>(
      `/companies/${companyId}/members/invite`,
      memberData
    );
    return data.data;
  },

  /**
   * Update member roles
   */
  async updateMemberRoles(
    companyId: string,
    memberId: string,
    roleIds: string[]
  ): Promise<CompanyMember> {
    const { data } = await api.patch<ApiResponse<CompanyMember>>(
      `/companies/${companyId}/members/${memberId}/roles`,
      { roleIds }
    );
    return data.data;
  },

  /**
   * Remove member from company
   */
  async removeMember(companyId: string, memberId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/members/${memberId}`);
  },

  /**
   * Get company roles
   */
  async getCompanyRoles(companyId: string): Promise<CompanyRole[]> {
    const { data } = await api.get<ApiResponse<CompanyRole[]>>(`/companies/${companyId}/roles`);
    return data.data ?? [];
  },

  /**
   * Create new company role
   */
  async createCompanyRole(
    companyId: string,
    roleData: CreateCompanyRoleDto
  ): Promise<CompanyRole> {
    const { data } = await api.post<ApiResponse<CompanyRole>>(`/companies/${companyId}/roles`, roleData);
    return data.data;
  },

  /**
   * Update company role
   */
  async updateCompanyRole(
    companyId: string,
    roleId: string,
    roleData: Partial<CreateCompanyRoleDto>
  ): Promise<CompanyRole> {
    const { data } = await api.patch<ApiResponse<CompanyRole>>(
      `/companies/${companyId}/roles/${roleId}`,
      roleData
    );
    return data.data;
  },

  /**
   * Delete company role
   */
  async deleteCompanyRole(companyId: string, roleId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/roles/${roleId}`);
  },
};
