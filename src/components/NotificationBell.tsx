import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { invitationsService } from '@/services/invitations.service';
import { calendarNotesService } from '@/services/calendar-notes.service';
import { Bell, Building2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const nb = t.notifications;
  const dateLocale = language === 'es' ? esLocale : enUS;

  const { data: invitations = [] } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: invitationsService.getPending,
    refetchInterval: 5 * 60_000, // SSE handles real-time; poll every 5 min as fallback
    staleTime: 10_000,
  });

  const { data: reminderCount = 0 } = useQuery({
    queryKey: ['upcoming-reminder-count'],
    queryFn: calendarNotesService.getUpcomingReminderCount,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  const dismissRemindersMutation = useMutation({
    mutationFn: calendarNotesService.dismissReminders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminder-count'] });
    },
  });

  const count = invitations.length + reminderCount;

  const acceptMutation = useMutation({
    mutationFn: invitationsService.accept,
    onSuccess: async (_, membershipId) => {
      const inv = invitations.find(i => i.id === membershipId);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast({ title: nb.joinedCompany(inv?.company.name ?? '') });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: nb.errorAccept });
    },
  });

  const declineMutation = useMutation({
    mutationFn: invitationsService.decline,
    onSuccess: (_, membershipId) => {
      const inv = invitations.find(i => i.id === membershipId);
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast({ title: nb.declinedFrom(inv?.company.name ?? '') });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: nb.errorDecline });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{nb.title}</h3>
          {count > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {invitations.length > 0 && nb.pendingInvitation(invitations.length)}
              {invitations.length > 0 && reminderCount > 0 && ' · '}
              {reminderCount > 0 && nb.upcomingReminder(reminderCount)}
            </p>
          )}
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">{nb.noNotifications}</p>
          </div>
        ) : (
          <ul className="divide-y max-h-[360px] overflow-y-auto">
            {reminderCount > 0 && (
              <li className="px-4 py-3 flex items-center gap-3 bg-primary/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {nb.upcomingReminder(reminderCount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nb.reminderBody}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs shrink-0 text-muted-foreground hover:text-foreground"
                  disabled={dismissRemindersMutation.isPending}
                  onClick={() => dismissRemindersMutation.mutate()}
                >
                  <X className="h-3 w-3 mr-1" />
                  {nb.dismiss}
                </Button>
              </li>
            )}
            {invitations.map(inv => (
              <li key={inv.id} className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={inv.company.logo ?? undefined} />
                    <AvatarFallback className="bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {nb.invitedToJoin}{' '}
                      <span className="font-semibold">{inv.company.name}</span>
                    </p>
                    {inv.roles.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {inv.roles.map(r => (
                          <span
                            key={r.id}
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: r.color ? `${r.color}22` : undefined,
                              color: r.color ?? undefined,
                              border: `1px solid ${r.color ?? 'hsl(var(--border))'}`,
                            }}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(inv.invitedAt), { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    onClick={() => acceptMutation.mutate(inv.id)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {nb.accept}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    onClick={() => declineMutation.mutate(inv.id)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {nb.decline}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
