import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ReviewRequestModal } from '@/components/ReviewRequestModal';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companyRequestsService } from '@/services/company-requests.service';
import { CompanyRequest, CompanyRequestStatus } from '@/types/company-requests.types';
import { Loader2, Eye, Search, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AdminCompanyRequests() {
  const { isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isPlatformAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isPlatformAdmin, navigate, toast]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await companyRequestsService.adminGetAllRequests({
        status: statusFilter as any,
      });
      setRequests(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPlatformAdmin) {
      loadRequests();
    }
  }, [statusFilter, isPlatformAdmin]);

  const handleReviewClick = (request: CompanyRequest) => {
    setSelectedRequest(request);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    loadRequests();
  };

  const filteredRequests = requests.filter((request) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.companyName.toLowerCase().includes(search) ||
      request.companySlug.toLowerCase().includes(search) ||
      request.user?.email.toLowerCase().includes(search) ||
      request.user?.fullName.toLowerCase().includes(search)
    );
  });

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel - Company Requests</h1>
            <p className="mt-1 text-muted-foreground">
              Review and manage all company creation requests
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Requests</CardTitle>
                <CardDescription>Review pending and completed requests</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[250px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                  {searchTerm ? 'No requests match your search' : 'No requests found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{request.user?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{request.user?.email || '-'}</p>
                          </div>
                        </TableCell>
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
                          {request.status === CompanyRequestStatus.PENDING ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReviewClick(request)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Review
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReviewClick(request)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
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

      <ReviewRequestModal
        request={selectedRequest}
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        onSuccess={handleReviewSuccess}
      />
    </DashboardLayout>
  );
}
