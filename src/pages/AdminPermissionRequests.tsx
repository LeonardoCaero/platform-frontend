import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { permissionRequestsService } from '@/services/permission-requests.service';
import { PermissionRequest, PermissionRequestStatus } from '@/types/permission-requests.types';
import { Loader2, Eye, Search, ShieldCheck, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminPermissionRequests() {
  const { isPlatformAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const ta = t.adminRequests;
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) return;
    if (!isPlatformAdmin) {
      toast({
        title: ta.accessDenied,
        description: ta.accessDeniedDesc,
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isPlatformAdmin, navigate, toast, authLoading]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-permission-requests', statusFilter],
    queryFn: () => permissionRequestsService.adminGetAllRequests({ status: statusFilter as PermissionRequestStatus }),
    enabled: !!isPlatformAdmin,
  });

  const requests = data?.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      permissionRequestsService.adminReviewRequest(id, { action, reviewNotes: notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-permission-requests'] });
      toast({
        title: variables.action === 'approve' ? ta.approveSuccess : ta.rejectSuccess,
        description:
          variables.action === 'approve'
            ? ta.permApprovedDesc
            : ta.permRejectedDesc,
      });
      setIsReviewModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: ta.reviewError,
        description: error.response?.data?.message || ta.reviewError,
        variant: 'destructive',
      });
    },
  });

  const handleReviewClick = (request: PermissionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      action: reviewAction,
      notes: reviewNotes || undefined,
    });
  };

  const filteredRequests = requests.filter((request) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.user?.email.toLowerCase().includes(search) ||
      request.user?.fullName.toLowerCase().includes(search) ||
      request.requestedPermission?.key.toLowerCase().includes(search)
    );
  });

  const getStatusText = (status: PermissionRequestStatus) => {
    switch (status) {
      case PermissionRequestStatus.PENDING:
        return 'Pending Review';
      case PermissionRequestStatus.APPROVED:
        return 'Approved';
      case PermissionRequestStatus.REJECTED:
        return 'Rejected';
      case PermissionRequestStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (!isPlatformAdmin) {
    return null;
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{ta.panelPermTitle}</h1>
            <p className="mt-1 text-muted-foreground">
              {ta.permSubtitle}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{ta.allPermRequestsTitle}</CardTitle>
                <CardDescription>{ta.allRequestsDesc}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={ta.searchPermPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[250px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={ta.filterStatusPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{ta.allStatuses}</SelectItem>
                    <SelectItem value="PENDING">{t.requests.pending}</SelectItem>
                    <SelectItem value="APPROVED">{t.requests.approved}</SelectItem>
                    <SelectItem value="REJECTED">{t.requests.rejected}</SelectItem>
                    <SelectItem value="CANCELLED">{t.requests.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? ta.noSearchMatch : ta.noRequests}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ta.colUser}</TableHead>
                      <TableHead>{ta.colPermission}</TableHead>
                      <TableHead>{ta.colStatus}</TableHead>
                      <TableHead>{ta.colSubmitted}</TableHead>
                      <TableHead>{ta.colReviewed}</TableHead>
                      <TableHead className="text-right">{ta.colActions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {request.user?.fullName || ta.unknown}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.user?.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.requestedPermission?.key || 'N/A'}
                            </p>
                            {request.requestedPermission?.description && (
                              <p className="text-xs text-muted-foreground">
                                {request.requestedPermission.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {request.reviewedAt
                            ? format(new Date(request.reviewedAt), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === PermissionRequestStatus.PENDING ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReviewClick(request, 'approve')}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                {ta.approve}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReviewClick(request, 'reject')}
                              >
                                <X className="mr-1 h-4 w-4" />
                                {ta.reject}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? ta.approvePermTitle : ta.rejectPermTitle}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' ? ta.approvePermDesc : ta.rejectPermDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{ta.userLabel}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{selectedRequest?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{ta.requestedPermLabel}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRequest?.requestedPermission?.key}
              </p>
              {selectedRequest?.requestedPermission?.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedRequest.requestedPermission.description}
                </p>
              )}
            </div>
            {selectedRequest?.reason && (
              <div>
                <p className="text-sm font-medium">{ta.userReasonLabel}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">{ta.reviewNotes}</Label>
              <Textarea
                id="reviewNotes"
                placeholder={ta.reviewNotesPlaceholder}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              {t.createCompany.cancel}
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReviewSubmit}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === 'approve' ? ta.approve : ta.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
