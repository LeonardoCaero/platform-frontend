import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { companyRequestsService } from '@/services/company-requests.service';
import { companiesService } from '@/services/companies.service';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RequestCompany() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    description: '',
    reason: '',
  });

  // Auto-generate slug from company name
  useEffect(() => {
    if (formData.companyName && !formData.companySlug) {
      const slug = companiesService.generateSlug(formData.companyName);
      setFormData((prev) => ({ ...prev, companySlug: slug }));
    }
  }, [formData.companyName, formData.companySlug]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.companySlug || formData.companySlug.length < 3) {
        setSlugAvailable(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const result = await companiesService.checkSlugAvailability(formData.companySlug);
        setSlugAvailable(result.available);
      } catch (error) {
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [formData.companySlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slugAvailable) {
      toast({
        title: 'Invalid slug',
        description: 'Please choose an available slug',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await companyRequestsService.createRequest({
        companyName: formData.companyName,
        companySlug: formData.companySlug,
        description: formData.description || undefined,
        reason: formData.reason || undefined,
      });

      toast({
        title: 'Request submitted!',
        description: 'An admin will review your company request soon.',
      });

      navigate('/my-requests');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = companiesService.generateSlug(value);
    setFormData((prev) => ({ ...prev, companySlug: formatted }));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Request Company Creation</h1>
          <p className="mt-2 text-muted-foreground">
            Submit a request to create a new company. An admin will review and approve it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Provide details about the company you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySlug">
                  Company Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companySlug"
                  placeholder="acme-corporation"
                  value={formData.companySlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                />
                {isCheckingSlug && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Slug is available
                  </p>
                )}
                {!isCheckingSlug && slugAvailable === false && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Slug is already taken
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Why do you need a company?"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your request will be reviewed by an administrator. You'll be notified once it's approved.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading || !slugAvailable}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
