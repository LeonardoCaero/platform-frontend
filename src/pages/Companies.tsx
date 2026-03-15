import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompanyCard } from '@/components/CompanyCard';
import { CompanyFilters, FilterValues } from '@/components/CompanyFilters';
import { Button } from '@/components/ui/button';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { companiesService } from '@/services/companies.service';
import { Company } from '@/types/company.types';
import { Building2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Companies() {
  const navigate = useNavigate();
  const { isPlatformAdmin, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const tc = t.companies;
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: 'ALL',
    includeDeleted: false,
  });
  const [page, setPage] = useState(1);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToRestore, setCompanyToRestore] = useState<Company | null>(null);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['companies', page, filters],
    queryFn: () =>
      companiesService.getCompanies({
        page,
        limit,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        includeDeleted: filters.includeDeleted,
      }),
  });

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
  };

  const handleRestoreClick = (company: Company) => {
    setCompanyToRestore(company);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    try {
      await companiesService.deleteCompany(companyToDelete.id);
      toast({ title: tc.deletedSuccess.replace('{{name}}', companyToDelete.name) });
      setCompanyToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: error.response?.data?.message || tc.deleteError });
    }
  };

  const handleRestoreConfirm = async () => {
    if (!companyToRestore) return;
    try {
      await companiesService.restoreCompany(companyToRestore.id);
      toast({ title: tc.restoredSuccess.replace('{{name}}', companyToRestore.name) });
      setCompanyToRestore(null);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: error.response?.data?.message || tc.restoreError });
    }
  };

  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{tc.title}</h1>
            </div>
            <p className="text-muted-foreground">
              {tc.adminSubtitle}
            </p>
          </div>
          <Button onClick={() => navigate('/companies/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {tc.createBtn}
          </Button>
        </div>

        <CompanyFilters onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-lg" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">{tc.noFound}</h3>
            <p className="text-muted-foreground text-center">
              {filters.search || filters.status !== 'ALL'
                ? tc.adjustFilters
                : tc.createFirst}
            </p>
            {!filters.search && filters.status === 'ALL' && (
              <Button onClick={() => navigate('/companies/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {tc.createBtn}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((company) => {
                const canManage = isPlatformAdmin || isOwnerOf(company.id);
                return (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onDelete={handleDeleteClick}
                    onRestore={handleRestoreClick}
                    canEdit={canManage}
                    canDelete={canManage}
                    canRestore={canManage}
                  />
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                <p className="text-sm text-muted-foreground">
                  {tc.showing} {(page - 1) * limit + 1} {tc.to}{' '}
                  {Math.min(page * limit, pagination.total)} {tc.of} {pagination.total} {tc.companiesLabel}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {tc.previous}
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        return p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                            <Button
                              variant={p === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(p)}
                              className="w-10"
                            >
                              {p}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    {tc.next}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc.deleteDesc} <strong>{companyToDelete?.name}</strong>?
              <br /><br />
              {tc.softDeleteNote}{' '}
              {companyToDelete?._count?.memberships || 0} {tc.memberUnit}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!companyToRestore} onOpenChange={() => setCompanyToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.restoreTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc.restoreDesc} <strong>{companyToRestore?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              {tc.restore}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
