import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { permissionsService } from '@/services/permissions.service';
import { Permission, PermissionScope } from '@/types/permission.types';
import { STANDARD_RESOURCES, STANDARD_ACTIONS, generatePermissionKey, validatePermissionKey } from '@/constants/permissions';
import { Shield, Pencil, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Permissions() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const p = t.permissions;
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<PermissionScope | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
      toast({ variant: 'destructive', title: p.toastInvalidKey });
      return;
    }

    try {
      await permissionsService.updatePermission(editingPermission.id, {
        key: permissionKey,
        description,
        scope,
      });
      toast({ title: p.toastUpdated });
      setIsEditDialogOpen(false);
      setEditingPermission(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: error.response?.data?.message || p.toastUpdateError });
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
              <h1 className="text-3xl font-bold">{p.title}</h1>
            </div>
            <p className="text-muted-foreground">
              {p.subtitle}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={p.searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={scopeFilter} onValueChange={handleScopeFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={p.filterScope} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{p.allScopes}</SelectItem>
              <SelectItem value={PermissionScope.GLOBAL}>{p.global}</SelectItem>
              <SelectItem value={PermissionScope.COMPANY}>{p.company}</SelectItem>
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
            <h3 className="text-xl font-semibold">{p.noPermissionsTitle}</h3>
            <p className="text-muted-foreground text-center">
              {search || scopeFilter !== 'ALL'
                ? p.noPermissionsFiltered
                : p.noPermissionsEmpty}
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{p.colKey}</TableHead>
                    <TableHead>{p.colDescription}</TableHead>
                    <TableHead>{p.colScope}</TableHead>
                    <TableHead className="text-center">{p.colRoles}</TableHead>
                    <TableHead className="text-center">{p.colUsers}</TableHead>
                    <TableHead className="text-right">{p.colActions}</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(permission)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
                  {p.showingStart} {(page - 1) * limit + 1} {p.showingTo}{' '}
                  {Math.min(page * limit, pagination.total)} {p.showingOf} {pagination.total} {p.permissionsLabel}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {p.previous}
                  </Button>
                  <span className="text-sm">
                    {p.pageOf} {page} {p.ofPages} {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    {p.next}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{p.editTitle}</DialogTitle>
            <DialogDescription>
              {p.editDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePermission}>
            <div className="space-y-4 py-4">
              {/* Resource Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="edit-resource">{p.resourceLabel}</Label>
                <Select value={resource} onValueChange={setResource}>
                  <SelectTrigger>
                    <SelectValue placeholder={p.resourcePlaceholder} />
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
                  <Label htmlFor="edit-customResource">{p.customResourceLabel}</Label>
                  <Input
                    id="edit-customResource"
                    placeholder={p.customResourcePlaceholder}
                    value={customResource}
                    onChange={(e) => setCustomResource(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {p.uppercaseHint}
                  </p>
                </div>
              )}

              {/* Action Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="edit-action">{p.actionLabel}</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder={p.actionPlaceholder} />
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
                  <Label htmlFor="edit-customAction">{p.customActionLabel}</Label>
                  <Input
                    id="edit-customAction"
                    placeholder={p.customActionPlaceholder}
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {p.uppercaseHint}
                  </p>
                </div>
              )}

              {/* Permission Key Preview */}
              {permissionKey && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">{p.keyPreview}</Label>
                  <div className={`font-mono text-lg font-bold ${isKeyValid ? 'text-green-600' : 'text-red-500'}`}>
                    {permissionKey || p.keyEmpty}
                  </div>
                  {!isKeyValid && permissionKey && (
                    <p className="text-xs text-red-500">
                      {p.keyInvalid}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">{p.descriptionLabel}</Label>
                <Input
                  id="edit-description"
                  placeholder={p.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label htmlFor="edit-scope">{p.scopeLabel}</Label>
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
                        <span>{p.global}</span>
                        <span className="text-xs text-muted-foreground">{p.globalDesc}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={PermissionScope.COMPANY}>
                      <div className="flex flex-col">
                        <span>{p.company}</span>
                        <span className="text-xs text-muted-foreground">{p.companyDesc}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {p.cancel}
              </Button>
              <Button type="submit" disabled={!isKeyValid}>
                {p.editSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
