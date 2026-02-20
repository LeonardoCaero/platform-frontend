import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { companiesService } from '@/services/companies.service';
import { CompanyStatus } from '@/types/company.types';
import { updateCompanySchema, UpdateCompanyFormData } from '@/schemas/company.schemas';
import { Save, Building2, Loader2 } from 'lucide-react';

export default function EditCompany() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = id!;

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesService.getCompanyById(companyId),
    enabled: !!companyId,
  });

  const form = useForm<UpdateCompanyFormData>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: '',
      slug: '',
      logo: '',
      description: '',
      status: CompanyStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        slug: company.slug,
        logo: company.logo || '',
        description: company.description || '',
        status: company.status,
      });
    }
  }, [company, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyFormData) =>
      companiesService.updateCompany(companyId, {
        name: data.name,
        slug: data.slug,
        logo: data.logo || undefined,
        description: data.description || undefined,
        status: data.status,
      }),
    onSuccess: (updatedCompany) => {
      toast.success(`${updatedCompany.name} has been updated`);
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate(`/companies/${companyId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company');
    },
  });

  const onSubmit = (values: UpdateCompanyFormData) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Company not found</h3>
            <Button onClick={() => navigate('/companies')}>Back to Companies</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Edit Company</h1>
          </div>
          <p className="text-muted-foreground">
            Update information for {company.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Make changes to the company details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="acme-corporation"
                  {...form.register('slug')}
                />
                <p className="text-sm text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  {...form.register('logo')}
                />
                {form.formState.errors.logo && (
                  <p className="text-sm text-destructive">{form.formState.errors.logo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your company..."
                  rows={4}
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as CompanyStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompanyStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={CompanyStatus.SUSPENDED}>Suspended</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/companies/${companyId}`)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
