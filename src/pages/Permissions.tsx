import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { permissionsService } from '@/services/permissions.service';
import { Permission, PermissionScope } from '@/types/permission.types';
import { STANDARD_RESOURCES, STANDARD_ACTIONS, generatePermissionKey, validatePermissionKey } from '@/constants/permissions';
import { Shield, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Permissions() {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<PermissionScope | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Form state for two-dropdown approach
  const [resource, setResource] = useState('');
  const [customResource, setCustomResource] = useState('');
  const [action, setAction] = useState('');
  const [customAction, setCustomAction] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<PermissionScope>(PermissionScope.COMPANY);

  const limit = 20;

  // Auto-generate permission key from resource and action
  const permissionKey = useMemo(() => {
    const res = resource === 'CUSTOM' ? customResource.toUpperCase() : resource;
    const act = action === 'CUSTOM' ? customAction.toUpperCase() : action;
    return generatePermissionKey(res, act);
  }, [resource, customResource, action, customAction]);

  // Validate generated key
  const isKeyValid = useMemo(() => {
    return permissionKey ? validatePermissionKey(permissionKey) : false;
  }, [permissionKey]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['permissions', page, search, scopeFilter],
    queryFn: () =>
      permissionsService.getPermissions({
        page,
        limit,
        search: search || undefined,
        scope: scopeFilter !== 'ALL' ? scopeFilter : undefined,
      }),
  });

  const resetForm = () => {
    setResource('');
    setCustomResource('');
    setAction('');
    setCustomAction('');
    setDescription('');
    setScope(PermissionScope.COMPANY);
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isKeyValid) {
      toast.error('Invalid permission key format');
      return;
    }
    
    try {
      await permissionsService.createPermission({
        key: permissionKey,
        description,
        scope,
      });
      toast.success('Permission created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleEditClick = (permission: Permission) => {
    setEditingPermission(permission);
    
    // Parse existing key to populate form
    const [res, act] = permission.key.split(':');
    
    // Check if resource is standard
    const standardResource = STANDARD_RESOURCES.find(r => r.value === res);
    if (standardResource && standardResource.value !== 'CUSTOM') {
      setResource(res);
      setCustomResource('');
    } else {
      setResource('CUSTOM');
      setCustomResource(res);
    }
    
    // Check if action is standard
    const standardAction = STANDARD_ACTIONS.find(a => a.value === act);
    if (standardAction && standardAction.value !== 'CUSTOM') {
      setAction(act);
      setCustomAction('');
    } else {
      setAction('CUSTOM');
      setCustomAction(act);
    }
    
    setDescription(permission.description || '');
    setScope(permission.scope);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermission) return;

    if (!isKeyValid) {
      toast.error('Invalid permission key format');
      return;
    }

    try {
      await permissionsService.updatePermission(editingPermission.id, {
        key: permissionKey,
        description,
        scope,
      });
      toast.success('Permission updated successfully');
      setIsEditDialogOpen(false);
      setEditingPermission(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update permission');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!permissionToDelete) return;

    try {
      await permissionsService.deletePermission(permissionToDelete.id);
      toast.success('Permission deleted successfully');
      setPermissionToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleScopeFilterChange = (value: string) => {
    setScopeFilter(value as PermissionScope | 'ALL');
    setPage(1);
  };

  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Permissions</h1>
            </div>
            <p className="text-muted-foreground">
              Manage global platform permissions
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Permission
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by key or description..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={scopeFilter} onValueChange={handleScopeFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Scopes</SelectItem>
              <SelectItem value={PermissionScope.GLOBAL}>Global</SelectItem>
              <SelectItem value={PermissionScope.COMPANY}>Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No permissions found</h3>
            <p className="text-muted-foreground text-center">
              {search || scopeFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first permission'}
            </p>
            {!search && scopeFilter === 'ALL' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-center">Roles</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-mono font-medium">
                        {permission.key}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {permission.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.scope === PermissionScope.GLOBAL ? 'default' : 'secondary'}>
                          {permission.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {permission._count?.roles || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission._count?.userGlobalPermissions || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(permission)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPermissionToDelete(permission)}
                            disabled={(permission._count?.roles || 0) > 0 || (permission._count?.userGlobalPermissions || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, pagination.total)} of {pagination.total} permissions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
            <DialogDescription>
              Create a new global permission following the RESOURCE:ACTION format
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePermission}>
            <div className="space-y-4 py-4">
              {/* Resource Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="resource">Resource Category *</Label>
                <Select value={resource} onValueChange={setResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_RESOURCES.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        <div className="flex flex-col items-start">
                          <span>{res.label}</span>
                          <span className="text-xs text-muted-foreground">{res.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Resource Input */}
              {resource === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="customResource">Custom Resource Name *</Label>
                  <Input
                    id="customResource"
                    placeholder="e.g., PROJECT, DOCUMENT"
                    value={customResource}
                    onChange={(e) => setCustomResource(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters and underscores only
                  </p>
                </div>
              )}

              {/* Action Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="action">Action *</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_ACTIONS.map((act) => (
                      <SelectItem key={act.value} value={act.value}>
                        <div className="flex flex-col">
                          <span>{act.label}</span>
                          <span className="text-xs text-muted-foreground">{act.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Action Input */}
              {action === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="customAction">Custom Action Name *</Label>
                  <Input
                    id="customAction"
                    placeholder="e.g., PUBLISH, ARCHIVE"
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters and underscores only
                  </p>
                </div>
              )}

              {/* Permission Key Preview */}
              {permissionKey && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">📋 Permission Key Preview</Label>
                  <div className={`font-mono text-lg font-bold ${isKeyValid ? 'text-green-600' : 'text-red-500'}`}>
                    {permissionKey || '(empty)'}
                  </div>
                  {!isKeyValid && permissionKey && (
                    <p className="text-xs text-red-500">
                      Invalid format. Must be RESOURCE:ACTION
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this permission"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label htmlFor="scope">Scope *</Label>
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as PermissionScope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PermissionScope.GLOBAL}>
                      <div className="flex flex-col items-start">
                        <span>Global</span>
                        <span className="text-xs text-muted-foreground">Platform-wide permission</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={PermissionScope.COMPANY}>
                      <div className="flex flex-col items-start">
                        <span>Company</span>
                        <span className="text-xs text-muted-foreground">Company-scoped permission</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isKeyValid}>
                Create Permission
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission details following the RESOURCE:ACTION format
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePermission}>
            <div className="space-y-4 py-4">
              {/* Resource Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="edit-resource">Resource Category *</Label>
                <Select value={resource} onValueChange={setResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_RESOURCES.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        <div className="flex flex-col items-start">
                          <span>{res.label}</span>
                          <span className="text-xs text-muted-foreground">{res.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Resource Input */}
              {resource === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-customResource">Custom Resource Name *</Label>
                  <Input
                    id="edit-customResource"
                    placeholder="e.g., PROJECT, DOCUMENT"
                    value={customResource}
                    onChange={(e) => setCustomResource(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters and underscores only
                  </p>
                </div>
              )}

              {/* Action Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="edit-action">Action *</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_ACTIONS.map((act) => (
                      <SelectItem key={act.value} value={act.value}>
                        <div className="flex flex-col">
                          <span>{act.label}</span>
                          <span className="text-xs text-muted-foreground">{act.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Action Input */}
              {action === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-customAction">Custom Action Name *</Label>
                  <Input
                    id="edit-customAction"
                    placeholder="e.g., PUBLISH, ARCHIVE"
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters and underscores only
                  </p>
                </div>
              )}

              {/* Permission Key Preview */}
              {permissionKey && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">📋 Permission Key Preview</Label>
                  <div className={`font-mono text-lg font-bold ${isKeyValid ? 'text-green-600' : 'text-red-500'}`}>
                    {permissionKey || '(empty)'}
                  </div>
                  {!isKeyValid && permissionKey && (
                    <p className="text-xs text-red-500">
                      Invalid format. Must be RESOURCE:ACTION
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Input
                  id="edit-description"
                  placeholder="Brief description of this permission"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label htmlFor="edit-scope">Scope *</Label>
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as PermissionScope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PermissionScope.GLOBAL}>
                      <div className="flex flex-col">
                        <span>Global</span>
                        <span className="text-xs text-muted-foreground">Platform-wide permission</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={PermissionScope.COMPANY}>
                      <div className="flex flex-col">
                        <span>Company</span>
                        <span className="text-xs text-muted-foreground">Company-scoped permission</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isKeyValid}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!permissionToDelete} onOpenChange={() => setPermissionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the permission{' '}
              <span className="font-mono font-semibold">{permissionToDelete?.key}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
