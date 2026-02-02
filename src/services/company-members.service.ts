import api from '@/lib/axios';
import {
  CompanyMember,
  InviteMemberDto,
  CompanyRole,
  CreateCompanyRoleDto,
} from '@/types/company.types';

export const companyMembersService = {
  /**
   * Get all members of a company
   */
  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const { data } = await api.get<CompanyMember[]>(`/companies/${companyId}/members`);
    return data;
  },

  /**
   * Invite a new member to company
   */
  async inviteMember(companyId: string, memberData: InviteMemberDto): Promise<CompanyMember> {
    const { data } = await api.post<CompanyMember>(
      `/companies/${companyId}/members/invite`,
      memberData
    );
    return data;
  },

  /**
   * Update member roles
   */
  async updateMemberRoles(
    companyId: string,
    memberId: string,
    roleIds: string[]
  ): Promise<CompanyMember> {
    const { data } = await api.patch<CompanyMember>(
      `/companies/${companyId}/members/${memberId}/roles`,
      { roleIds }
    );
    return data;
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
    const { data } = await api.get<CompanyRole[]>(`/companies/${companyId}/roles`);
    return data;
  },

  /**
   * Create new company role
   */
  async createCompanyRole(
    companyId: string,
    roleData: CreateCompanyRoleDto
  ): Promise<CompanyRole> {
    const { data } = await api.post<CompanyRole>(`/companies/${companyId}/roles`, roleData);
    return data;
  },

  /**
   * Update company role
   */
  async updateCompanyRole(
    companyId: string,
    roleId: string,
    roleData: Partial<CreateCompanyRoleDto>
  ): Promise<CompanyRole> {
    const { data } = await api.patch<CompanyRole>(
      `/companies/${companyId}/roles/${roleId}`,
      roleData
    );
    return data;
  },

  /**
   * Delete company role
   */
  async deleteCompanyRole(companyId: string, roleId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/roles/${roleId}`);
  },
};
