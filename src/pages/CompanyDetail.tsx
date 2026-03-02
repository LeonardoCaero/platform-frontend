import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { OverviewTab } from '@/components/company/OverviewTab';
import { MembersTab } from '@/components/company/MembersTab';
import { RolesTab } from '@/components/company/RolesTab';
import { SettingsTab } from '@/components/company/SettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { companiesService } from '@/services/companies.service';
import { companyMembersService } from '@/services/company-members.service';
import { Users, Shield, Settings, Info } from 'lucide-react';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOwnerOf, getMembershipId, selectedCompany, setSelectedCompany, refreshUser } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const companyId = id!;

  // Role-based access control
  const isOwner = isOwnerOf(companyId); // true for platform admins and company owners
  const membershipId = getMembershipId(companyId);
  const isMember = !!membershipId; // true only for actual members (not platform admins)

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesService.getCompanyById(companyId),
    enabled: !!companyId,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: () => companyMembersService.getCompanyMembers(companyId),
    enabled: !!companyId,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['company-roles', companyId],
    queryFn: () => companyMembersService.getCompanyRoles(companyId),
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => companiesService.deleteCompany(companyId),
    onSuccess: () => {
      toast({ title: 'Company has been deleted' });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      // Deselect if this was the active company
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
        refreshUser();
      }
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: error.response?.data?.message || 'Failed to delete company' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => companiesService.restoreCompany(companyId),
    onSuccess: () => {
      toast({ title: 'Company has been restored' });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      setRestoreDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: error.response?.data?.message || 'Failed to restore company' });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => companyMembersService.removeMember(companyId, membershipId!),
    onSuccess: () => {
      toast({ title: 'You have left the company' });
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
      refreshUser();
      navigate('/companies');
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: error.response?.data?.message || 'Failed to leave company' });
    },
  });

  if (companyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Company not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CompanyHeader
          company={company}
          canManage={isOwner}
          onEdit={() => navigate(`/companies/${company.id}/edit`)}
          onDelete={() => setDeleteDialogOpen(true)}
          onRestore={() => setRestoreDialogOpen(true)}
        />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab company={company} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembersTab companyId={companyId} members={members} isLoading={membersLoading} canInvite={isOwner} />
          </TabsContent>

          {isOwner && (
            <TabsContent value="roles" className="mt-6">
              <RolesTab roles={roles} isLoading={rolesLoading} />
            </TabsContent>
          )}

          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              canDelete={isOwner && !company.deletedAt}
              canLeave={isMember && !company.deletedAt}
              onDelete={() => setDeleteDialogOpen(true)}
              onLeave={() => setLeaveDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{company.name}</strong>?
              <br /><br />
              This will soft delete the company with {company._count?.memberships || 0} member(s).
              It can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore <strong>{company.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => restoreMutation.mutate()}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{company.name}</strong>?
              <br /><br />
              You will immediately lose access to this company and all its resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveMutation.mutate()}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
