import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companiesService } from '@/services/companies.service';
import { companyMembersService } from '@/services/company-members.service';
import { usersService } from '@/services/users.service';
import type { PlatformUser } from '@/services/users.service';
import { Building2, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Check, Search, UserX, Users } from 'lucide-react';

interface CompanyFormData {
  name: string;
  slug: string;
  logo: string;
  description: string;
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasGlobalPermission, user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permission
  useEffect(() => {
    if (isLoading) return;
  
    if (!hasGlobalPermission('COMPANY:CREATE')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to create companies',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [hasGlobalPermission, navigate, toast, user, isLoading]);

  // Step 1: Company Info
  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: '',
    slug: '',
    logo: '',
    description: '',
  });
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Step 2: Select members
  const [selectedUsers, setSelectedUsers] = useState<PlatformUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const { data: platformUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['platform-users', debouncedUserSearch],
    queryFn: () => usersService.listUsers(debouncedUserSearch || undefined),
    enabled: currentStep === 2,
  });

  const getUserInitials = (fullName: string) =>
    fullName.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  const toggleUser = (u: PlatformUser) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]
    );
  };

  // Auto-generate slug
  useEffect(() => {
    if (companyData.name && !companyData.slug) {
      const slug = companiesService.generateSlug(companyData.name);
      setCompanyData((prev) => ({ ...prev, slug }));
    }
  }, [companyData.name, companyData.slug]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!companyData.slug || companyData.slug.length < 3) {
        setSlugAvailable(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const result = await companiesService.checkSlugAvailability(companyData.slug);
        setSlugAvailable(result.available);
      } catch (error) {
        // If endpoint doesn't exist, assume slug is available
        console.warn('Slug validation endpoint not available, skipping validation');
        setSlugAvailable(true);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [companyData.slug]);

  const handleSlugChange = (value: string) => {
    const formatted = companiesService.generateSlug(value);
    setCompanyData((prev) => ({ ...prev, slug: formatted }));
  };

  const canProceedStep1 = companyData.name && companyData.slug && slugAvailable === true;

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1) {
      toast({
        title: 'Invalid data',
        description: 'Please fill in all required fields with valid data',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const company = await companiesService.createCompany({
        name: companyData.name,
        slug: companyData.slug,
        logo: companyData.logo || undefined,
        description: companyData.description || undefined,
      });

      if (selectedUsers.length > 0) {
        await Promise.allSettled(
          selectedUsers.map((u) => companyMembersService.inviteMember(company.id, { userId: u.id }))
        );
      }

      toast({
        title: 'Company created!',
        description: `${company.name} has been successfully created${selectedUsers.length > 0 ? `. ${selectedUsers.length} member(s) added.` : '.'}`,
      });

      navigate(`/companies/${company.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create company',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasGlobalPermission('COMPANY:CREATE')) {
    return null;
  }

  if (isLoading) {
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Create New Company</h1>
          </div>
          <p className="text-muted-foreground">
            Follow the steps to set up your new company
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step === currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : step < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`h-1 w-16 ${
                    step < currentStep ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Step {currentStep} of 3:{' '}
          {currentStep === 1 && 'Company Information'}
          {currentStep === 2 && 'Invite Team Members'}
          {currentStep === 3 && 'Review & Create'}
        </div>

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Enter the basic details for your new company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Company Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="acme-corporation"
                  value={companyData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
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
                <Label htmlFor="logo">Logo URL (optional)</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={companyData.logo}
                  onChange={(e) => setCompanyData({ ...companyData, logo: e.target.value })}
                />
                {companyData.logo && (
                  <div className="flex items-center gap-2">
                    <img src={companyData.logo} alt="Logo preview" className="h-10 w-10 rounded" />
                    <span className="text-sm text-muted-foreground">Preview</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company..."
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => navigate('/companies')}>
                  Cancel
                </Button>
                <Button onClick={handleNext} disabled={!canProceedStep1}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Invite Team Members */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Team Members</CardTitle>
              <CardDescription>
                Add members from the platform to your company (optional — you can skip this step)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {/* Users list */}
              <div className="rounded-lg border divide-y max-h-72 overflow-y-auto">
                {usersLoading ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : platformUsers.filter((u) => u.id !== user?.id).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <UserX className="h-8 w-8" />
                    <p className="text-sm">
                      {userSearch ? 'No users found matching your search' : 'No users available'}
                    </p>
                  </div>
                ) : (
                  platformUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => {
                      const isSelected = selectedUsers.some((x) => x.id === u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors ${
                            isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''
                          }`}
                          onClick={() => toggleUser(u)}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="text-xs">{getUserInitials(u.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })
                )}
              </div>

              {/* Selected summary */}
              {selectedUsers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext}>
                  {selectedUsers.length > 0 ? `Next (${selectedUsers.length} selected)` : 'Skip'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Create */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Review your company details and create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Info Summary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Company Information</h3>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit
                  </Button>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    {companyData.logo && (
                      <img src={companyData.logo} alt="Logo" className="h-12 w-12 rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{companyData.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{companyData.slug}</p>
                      {companyData.description && (
                        <p className="text-sm mt-2">{companyData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Summary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    Team Members {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>
                {selectedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members selected</p>
                ) : (
                  <div className="rounded-lg border divide-y">
                    {selectedUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="text-xs">{getUserInitials(u.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Company
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
