import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { companiesService } from '@/services/companies.service';
import { Company } from '@/types/company.types';
import { Building2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Companies() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: 'ALL',
    includeDeleted: false,
  });
  const [page, setPage] = useState(1);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const limit = 12;

  const { data, isLoading, refetch } = useQuery({
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

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    try {
      await companiesService.deleteCompany(companyToDelete.id);
      toast.success(`${companyToDelete.name} has been deleted`);
      setCompanyToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete company');
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
              <h1 className="text-3xl font-bold">Companies</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your companies and their members
            </p>
          </div>
          <Button onClick={() => navigate('/companies/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Company
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
            <h3 className="text-xl font-semibold">No companies found</h3>
            <p className="text-muted-foreground text-center">
              {filters.search || filters.status !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first company'}
            </p>
            {!filters.search && filters.status === 'ALL' && (
              <Button onClick={() => navigate('/companies/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onDelete={handleDeleteClick}
                  canEdit={true}
                  canDelete={true}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, pagination.total)} of {pagination.total} companies
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
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
                    Next
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
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{companyToDelete?.name}</strong>?
              <br /><br />
              This will soft delete the company. It can be restored later. The company has{' '}
              {companyToDelete?._count?.memberships || 0} member(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
