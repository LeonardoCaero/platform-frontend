import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { companiesService } from '@/services/companies.service';
import { useSlugValidation } from '@/hooks/useSlugValidation';
import { createCompanySchema, CreateCompanyFormData } from '@/schemas/company.schemas';
import { Building2, RefreshCw, Check, X, Loader2 } from 'lucide-react';

export default function CreateCompany() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      slug: '',
      logo: '',
      description: '',
    },
  });

  const slugValue = form.watch('slug');
  const { isChecking, isAvailable } = useSlugValidation(slugValue);

  const handleGenerateSlug = () => {
    const name = form.getValues('name');
    if (name) {
      form.setValue('slug', companiesService.generateSlug(name));
    }
  };

  const onSubmit = async (values: CreateCompanyFormData) => {
    if (isAvailable === false) {
      toast.error('This slug is already taken. Please choose another.');
      return;
    }

    setIsSubmitting(true);
    try {
      const company = await companiesService.createCompany({
        name: values.name,
        slug: values.slug,
        logo: values.logo || undefined,
        description: values.description || undefined,
      });

      toast.success(`${company.name} has been successfully created`);
      navigate(`/companies/${company.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSlugIcon = () => {
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isAvailable === true) return <Check className="h-4 w-4 text-green-500" />;
    if (isAvailable === false) return <X className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Create New Company</h1>
          </div>
          <p className="text-muted-foreground">
            Set up a new company to manage teams and projects
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Enter the details for your new company. All fields except description are required.
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
                  onBlur={() => {
                    if (!form.getValues('slug')) {
                      handleGenerateSlug();
                    }
                  }}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="slug"
                    placeholder="acme-corporation"
                    {...form.register('slug')}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getSlugIcon()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
                {isAvailable === false && (
                  <p className="text-sm text-destructive">This slug is already taken</p>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSlug}
                    disabled={!form.watch('name')}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate from name
                  </Button>
                </div>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/companies')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isAvailable === false}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Company
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
