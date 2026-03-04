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
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  const rm = t.reviewModal;
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
        title: action === 'approve' ? rm.toastApproved : rm.toastRejected,
        description: action === 'approve' ? rm.toastApprovedDesc : rm.toastRejectedDesc,
      });

      onSuccess();
      onOpenChange(false);
      setReviewNotes('');
    } catch (error: any) {
      toast({
        title: rm.toastError,
        description: error.response?.data?.message || rm.toastErrorDesc,
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
          <DialogTitle>{rm.title}</DialogTitle>
          <DialogDescription>
            {rm.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{rm.companyName}</Label>
              <p className="text-sm font-medium">{request.companyName}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{rm.companySlug}</Label>
              <p className="text-sm font-mono">{request.companySlug}</p>
            </div>

            {request.description && (
              <div>
                <Label className="text-xs text-muted-foreground">{rm.descriptionField}</Label>
                <p className="text-sm">{request.description}</p>
              </div>
            )}

            {request.reason && (
              <div>
                <Label className="text-xs text-muted-foreground">{rm.reason}</Label>
                <p className="text-sm">{request.reason}</p>
              </div>
            )}

            <Separator />

            {request.user && (
              <div>
                <Label className="text-xs text-muted-foreground">{rm.requestedBy}</Label>
                <p className="text-sm font-medium">{request.user.fullName}</p>
                <p className="text-xs text-muted-foreground">{request.user.email}</p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">{rm.submittedDate}</Label>
              <p className="text-sm">{format(new Date(request.createdAt), 'PPpp')}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="reviewNotes">{rm.reviewNotes}</Label>
            <Textarea
              id="reviewNotes"
              placeholder={rm.reviewNotesPlaceholder}
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
            {rm.cancel}
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
            {rm.reject}
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
            {rm.approve}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
