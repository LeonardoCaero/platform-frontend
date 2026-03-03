import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { companyMembersService } from '@/services/company-members.service';
import type { UserSearchResult } from '@/types/company.types';
import { Check, Search, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

function getInitials(u: UserSearchResult) {
  return `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || '?';
}

export function InviteMemberModal({ open, onOpenChange, companyId }: InviteMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<UserSearchResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['non-members', companyId, debouncedSearch],
    queryFn: () => companyMembersService.searchNonMembers(companyId, debouncedSearch || undefined),
    enabled: open,
  });

  const inviteMutation = useMutation({
    mutationFn: () => companyMembersService.inviteMember(companyId, { userId: selected!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-members', companyId] });
      toast({ title: `${selected!.firstName} added to the company` });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Could not add member',
      });
    },
  });

  const handleClose = () => {
    setSearch('');
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search for a platform user to add to this company. They will be added as INVITED.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
              }}
            />
          </div>

          {/* Results list */}
          <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <UserX className="h-8 w-8" />
                <p className="text-sm">
                  {search ? 'No users found matching your search' : 'No users available to add'}
                </p>
              </div>
            ) : (
              results.map(user => {
                const isSelected = selected?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors',
                      isSelected && 'bg-primary/10 hover:bg-primary/15'
                    )}
                    onClick={() => setSelected(isSelected ? null : user)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {selected && (
            <p className="text-sm text-muted-foreground">
              Selected: <strong>{selected.firstName} {selected.lastName}</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!selected || inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            {inviteMutation.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
