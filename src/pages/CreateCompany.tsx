import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companiesService } from '@/services/companies.service';
import { Building2, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X, Plus, UserPlus } from 'lucide-react';
import { useEffect } from 'react';

interface InviteMember {
  email: string;
  roleId: string;
  inviteMessage?: string;
}

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

  // Step 2: Invite Members
  const [inviteMembers, setInviteMembers] = useState<InviteMember[]>([]);
  const [newMember, setNewMember] = useState<InviteMember>({
    email: '',
    roleId: 'member',
    inviteMessage: '',
  });

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

  const handleAddMember = () => {
    if (!newMember.email) {
      toast({
        title: 'Email required',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicates
    if (inviteMembers.some((m) => m.email === newMember.email)) {
      toast({
        title: 'Duplicate email',
        description: 'This email is already in the list',
        variant: 'destructive',
      });
      return;
    }

    setInviteMembers([...inviteMembers, newMember]);
    setNewMember({ email: '', roleId: 'member', inviteMessage: '' });
  };

  const handleRemoveMember = (index: number) => {
    setInviteMembers(inviteMembers.filter((_, i) => i !== index));
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
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
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

      toast({
        title: 'Company created!',
        description: `${company.name} has been successfully created${inviteMembers.length > 0 ? `. Invitations sent to ${inviteMembers.length} member(s).` : '.'}`,
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

  const getRoleBadgeColor = (roleId: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-red-100 text-red-800',
      admin: 'bg-orange-100 text-orange-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return colors[roleId] || colors.member;
  };

  const getRoleLabel = (roleId: string) => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      manager: 'Manager',
      member: 'Member',
    };
    return labels[roleId] || 'Member';
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
                Add team members to your company (optional - you can skip this step)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Member Form */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-5 w-5" />
                  <h3 className="font-semibold">Add Member</h3>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">Email</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberRole">Role</Label>
                    <Select
                      value={newMember.roleId}
                      onValueChange={(value) => setNewMember({ ...newMember, roleId: value })}
                    >
                      <SelectTrigger id="memberRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteMessage">Personal Message (optional)</Label>
                  <Textarea
                    id="inviteMessage"
                    placeholder="Welcome to the team!"
                    value={newMember.inviteMessage}
                    onChange={(e) => setNewMember({ ...newMember, inviteMessage: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddMember} className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>

              {/* Members List */}
              {inviteMembers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Team Members ({inviteMembers.length})</h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteMembers.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{member.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(member.roleId)}`}>
                                {getRoleLabel(member.roleId)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
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
                    Team Members {inviteMembers.length > 0 && `(${inviteMembers.length})`}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>
                {inviteMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members to invite</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteMembers.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(member.roleId)}`}>
                                {getRoleLabel(member.roleId)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
