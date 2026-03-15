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
import { permissionRequestsService } from '@/services/permission-requests.service';
import { PermissionRequest, PermissionRequestStatus } from '@/types/permission-requests.types';
import { Loader2, Plus, X, Key } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyPermissionRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const tr = t.requests;
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requestToCancel, setRequestToCancel] = useState<PermissionRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-permission-requests', statusFilter],
    queryFn: () => permissionRequestsService.getMyRequests({ status: statusFilter as PermissionRequestStatus | 'ALL' }),
  });

  const requests = data?.data ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => permissionRequestsService.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-permission-requests'] });
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
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{tr.permTitle}</h1>
              <p className="mt-1 text-muted-foreground">
                {tr.permSubtitle}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/request-permission')}>
            <Plus className="mr-2 h-4 w-4" />
            {tr.newPermRequest}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tr.permRequestsCardTitle}</CardTitle>
                <CardDescription>{tr.permRequestsCardDesc}</CardDescription>
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
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{tr.noRequests}</p>
                <Button variant="link" onClick={() => navigate('/request-permission')}>
                  {tr.createFirstPermRequest}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.colPermission}</TableHead>
                    <TableHead>{tr.colType}</TableHead>
                    <TableHead>{tr.colStatus}</TableHead>
                    <TableHead>{tr.colSubmitted}</TableHead>
                    <TableHead>{tr.colReviewed}</TableHead>
                    <TableHead className="text-right">{tr.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.requestedPermission?.key || 'N/A'}
                          </p>
                          {request.requestedPermission?.description && (
                            <p className="text-sm text-muted-foreground">
                              {request.requestedPermission.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {request.type}
                        </span>
                      </TableCell>
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
                          {request.status === PermissionRequestStatus.PENDING && (
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
              {tr.permCancelDialogDesc.replace('{{key}}', requestToCancel?.requestedPermission?.key ?? '')}
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
