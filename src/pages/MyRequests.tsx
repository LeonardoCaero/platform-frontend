import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { companyRequestsService } from '@/services/company-requests.service';
import { CompanyRequest, CompanyRequestStatus } from '@/types/company-requests.types';
import { Loader2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const tr = t.requests;
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requestToCancel, setRequestToCancel] = useState<CompanyRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-company-requests', statusFilter],
    queryFn: () => companyRequestsService.getMyRequests({ status: statusFilter as CompanyRequestStatus | 'ALL' }),
  });

  const requests = data?.data ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => companyRequestsService.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company-requests'] });
      toast({ title: tr.cancelSuccess, description: tr.cancelSuccessDesc });
      setRequestToCancel(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: tr.error, description: error.response?.data?.message || tr.cancelError });
    },
  });

  const handleCancel = () => {
    if (!requestToCancel) return;
    cancelMutation.mutate(requestToCancel.id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{tr.title}</h1>
            <p className="mt-2 text-muted-foreground">
              {tr.subtitle}
            </p>
          </div>
          <Button onClick={() => navigate('/request-company')}>
            <Plus className="mr-2 h-4 w-4" />
            {tr.newRequest}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tr.requestsCardTitle}</CardTitle>
                <CardDescription>{tr.requestsCardDesc}</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={tr.filterStatusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{tr.allStatuses}</SelectItem>
                  <SelectItem value="PENDING">{tr.pending}</SelectItem>
                  <SelectItem value="APPROVED">{tr.approved}</SelectItem>
                  <SelectItem value="REJECTED">{tr.rejected}</SelectItem>
                  <SelectItem value="COMPLETED">{tr.completed}</SelectItem>
                  <SelectItem value="CANCELLED">{tr.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{tr.noRequests}</p>
                <Button variant="link" onClick={() => navigate('/request-company')}>
                  {tr.createFirstRequest}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.colCompanyName}</TableHead>
                    <TableHead>{tr.colSlug}</TableHead>
                    <TableHead>{tr.colStatus}</TableHead>
                    <TableHead>{tr.colSubmitted}</TableHead>
                    <TableHead>{tr.colReviewed}</TableHead>
                    <TableHead className="text-right">{tr.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.companyName}</TableCell>
                      <TableCell className="font-mono text-sm">{request.companySlug}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {request.reviewedAt
                          ? format(new Date(request.reviewedAt), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.status === CompanyRequestStatus.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRequestToCancel(request)}
                              disabled={cancelMutation.isPending && requestToCancel?.id === request.id}
                            >
                              {cancelMutation.isPending && requestToCancel?.id === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="mr-1 h-4 w-4" />
                                  {tr.cancelRequest}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!requestToCancel} onOpenChange={() => setRequestToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.cancelDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.cancelDialogDesc.replace('{{name}}', requestToCancel?.companyName ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.cancelDialogKeep}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>{tr.cancelDialogConfirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
