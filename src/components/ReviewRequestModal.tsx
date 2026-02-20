import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CompanyRequest } from '@/types/company-requests.types';
import { companyRequestsService } from '@/services/company-requests.service';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewRequestModalProps {
  request: CompanyRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReviewRequestModal({ request, open, onOpenChange, onSuccess }: ReviewRequestModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!request) return;

    setIsLoading(true);
    try {
      await companyRequestsService.adminReviewRequest(request.id, {
        action,
        reviewNotes: reviewNotes || undefined,
      });

      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        description: `Company request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      onSuccess();
      onOpenChange(false);
      setReviewNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to ${action} request`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Company Request</DialogTitle>
          <DialogDescription>
            Review the details and approve or reject this company creation request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <p className="text-sm font-medium">{request.companyName}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Company Slug</Label>
              <p className="text-sm font-mono">{request.companySlug}</p>
            </div>

            {request.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{request.description}</p>
              </div>
            )}

            {request.reason && (
              <div>
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <p className="text-sm">{request.reason}</p>
              </div>
            )}

            <Separator />

            {/* User Info */}
            {request.user && (
              <div>
                <Label className="text-xs text-muted-foreground">Requested By</Label>
                <p className="text-sm font-medium">{request.user.fullName}</p>
                <p className="text-xs text-muted-foreground">{request.user.email}</p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Submitted Date</Label>
              <p className="text-sm">{format(new Date(request.createdAt), 'PPpp')}</p>
            </div>
          </div>

          <Separator />

          {/* Review Notes */}
          <div className="space-y-2">
            <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
            <Textarea
              id="reviewNotes"
              placeholder="Add any notes about your decision..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleReview('reject')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => handleReview('approve')}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
