import api from '@/lib/axios';

export interface PendingInvitation {
  id: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  roles: { id: string; name: string; color?: string | null }[];
  invitedAt: string;
}

export const invitationsService = {
  async getPending(): Promise<PendingInvitation[]> {
    const { data } = await api.get<PendingInvitation[]>('/invitations');
    return data;
  },

  async accept(membershipId: string): Promise<void> {
    await api.post(`/invitations/${membershipId}/accept`);
  },

  async decline(membershipId: string): Promise<void> {
    await api.post(`/invitations/${membershipId}/decline`);
  },
};
