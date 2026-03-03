import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { permissionRequestsService } from '@/services/permission-requests.service';
import { Permission, PermissionRequestStatus } from '@/types/permission-requests.types';
import { Loader2, AlertCircle, Key } from 'lucide-react';

export default function RequestPermission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [{ loadingPermissions, availablePermissions }, setPermState] = useState<{
    loadingPermissions: boolean;
    availablePermissions: Permission[];
  }>({ loadingPermissions: true, availablePermissions: [] });

  const [formData, setFormData] = useState({
    requestedPermissionId: '',
    reason: '',
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const [permissions, requestsResponse] = await Promise.all([
          permissionRequestsService.getAvailablePermissions(),
          permissionRequestsService.getMyRequests({ status: PermissionRequestStatus.PENDING }),
        ]);

        const userPermissionIds = (user?.globalPermissions ?? []).map((p) => p.key);

        const pendingPermissionIds = requestsResponse.data
          .map((req) => req.requestedPermissionId)
          .filter(Boolean);

        const available = permissions.filter(
          (p) => !userPermissionIds.includes(p.key) && !pendingPermissionIds.includes(p.id)
        );

        setPermState({ loadingPermissions: false, availablePermissions: available });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load available permissions',
          variant: 'destructive',
        });
        setPermState({ loadingPermissions: false, availablePermissions: [] });
      }
    };

    loadPermissions();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.requestedPermissionId) {
      toast({
        title: 'Permission required',
        description: 'Please select a permission to request',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await permissionRequestsService.createRequest({
        requestedPermissionId: formData.requestedPermissionId,
        reason: formData.reason || undefined,
      });

      toast({
        title: 'Request submitted!',
        description: 'An admin will review your permission request soon.',
      });

      navigate('/my-permission-requests');
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Key className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Request Permission</h1>
            <p className="mt-1 text-muted-foreground">
              Submit a request to gain additional permissions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permission Request</CardTitle>
            <CardDescription>Choose the permission you need and explain why</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="permission">
                  Permission <span className="text-destructive">*</span>
                </Label>
                {loadingPermissions ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available permissions...
                  </div>
                ) : availablePermissions.length === 0 ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          No permissions available
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You already have all available global permissions, or there are no permissions to request.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={formData.requestedPermissionId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, requestedPermissionId: value })
                    }
                  >
                    <SelectTrigger id="permission">
                      <SelectValue placeholder="Select a permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissions.map((permission) => (
                        <SelectItem key={permission.id} value={permission.id}>
                          <div>
                            <div className="font-medium">{permission.key}</div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need this permission..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{formData.reason.length}/1000</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your request will be reviewed by a platform administrator. You'll be notified once it's approved or rejected.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || availablePermissions.length === 0}
                >
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
