import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { useToast } from '@/hooks/use-toast';
import { companiesService } from '@/services/companies.service';
import { CompanyStatus } from '@/types/company.types';
import { updateCompanySchema, UpdateCompanyFormData } from '@/schemas/company.schemas';
import { Save, Building2, Loader2 } from 'lucide-react';
import { uploadsService } from '@/services/uploads.service';

export default function EditCompany() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const ec = t.editCompany;
  const companyId = id!;

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
    form.reset({
      name: company?.name ?? '',
      slug: company?.slug ?? '',
      logo: company?.logo ?? '',
      description: company?.description ?? '',
      status: company?.status ?? CompanyStatus.ACTIVE,
    });
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
      toast({ title: `${updatedCompany.name} has been updated` });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate(`/companies/${companyId}`);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: error.response?.data?.message || ec.updateError });
    },
  });

  const onSubmit = (values: UpdateCompanyFormData) => {
    updateMutation.mutate(values);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    setIsUploadingLogo(true);
    try {
      const url = await uploadsService.uploadLogo(file);
      form.setValue('logo', url, { shouldDirty: true });
    } catch {
      toast({ variant: 'destructive', title: ec.uploadError });
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
    }
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
            <h3 className="text-xl font-semibold">{ec.notFound}</h3>
            <Button onClick={() => navigate('/companies')}>{ec.backToCompanies}</Button>
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
            <h1 className="text-3xl font-bold">{ec.title}</h1>
          </div>
          <p className="text-muted-foreground">
            {ec.subtitle} {company.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{ec.cardTitle}</CardTitle>
            <CardDescription>
              {ec.cardDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {ec.companyName} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={ec.namePlaceholder}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  {ec.slug} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder={ec.slugPlaceholder}
                  {...form.register('slug')}
                />
                <p className="text-sm text-muted-foreground">
                  {ec.slugHint}
                </p>
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">{ec.logoUrl}</Label>
                <div className="flex items-center gap-3">
                  {(logoPreview || form.watch('logo')) && !isUploadingLogo && (
                    <img src={logoPreview ?? form.watch('logo')} alt="Logo preview" className="h-10 w-10 rounded object-cover shrink-0" />
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="cursor-pointer"
                  />
                  {isUploadingLogo && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{ec.description}</Label>
                <Textarea
                  id="description"
                  placeholder={ec.descriptionPlaceholder}
                  rows={4}
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  {ec.status} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as CompanyStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ec.statusPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompanyStatus.ACTIVE}>{ec.statusActive}</SelectItem>
                    <SelectItem value={CompanyStatus.SUSPENDED}>{ec.statusSuspended}</SelectItem>
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
                  {ec.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {ec.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
