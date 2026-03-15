import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { UseFormHandleSubmit, UseFormRegister, FieldErrors, Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  getDay,
} from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { timeEntriesService } from '@/services/time-entries.service';
import { projectsService } from '@/services/projects.service';
import { clientsService } from '@/services/clients.service';
import { categoriesService } from '@/services/categories.service';
import { companyMembersService } from '@/services/company-members.service';
import type { CompanyMember } from '@/types/company.types';
import type { Client, TimeEntryCategory } from '@/types/clients.types';
import type { TimeEntry, Project, UpdateTimeEntryDto } from '@/types/time-tracker.types';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Clock, Plus, CalendarIcon, Users, AlertCircle, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'daily' | 'weekly' | 'monthly';

interface EntryCardProps {
  entry: TimeEntry;
  compact?: boolean;
  currentUserId: string | undefined;
  canManageAll: boolean;
  tt: Record<string, any>;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}

function EntryCard({ entry, compact = false, currentUserId, canManageAll, tt, onEdit, onDelete }: EntryCardProps) {
  const isOwnEntry = entry.userId === currentUserId;
  const canDelete = isOwnEntry || canManageAll;
  const canEdit = isOwnEntry || canManageAll;
  const totalMins = Math.round(Number(entry.hours) * 60);
  const hDisplay = Math.floor(totalMins / 60);
  const mDisplay = totalMins % 60;
  const durationLabel = mDisplay > 0 ? `${hDisplay}h ${mDisplay}m` : `${hDisplay}h`;
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border bg-card transition-colors group',
      compact ? 'p-3' : 'p-4',
      isOwnEntry && 'border-primary/40 bg-primary/5'
    )}>
      {/* Color bar */}
      <div
        className={cn('self-stretch w-1 rounded-full shrink-0', !entry.project?.color && 'bg-muted')}
        style={{ backgroundColor: entry.project?.color ?? undefined }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className={cn('font-semibold leading-snug', compact ? 'text-xs' : 'text-sm')}>{entry.title}</span>
          {entry.project && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0" style={{ borderColor: entry.project.color ?? undefined }}>
              {entry.project.name}
            </Badge>
          )}
          {entry.isOvertime && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-orange-500 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />{tt.overtime}
            </Badge>
          )}
          {entry.category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              <span className="h-2 w-2 rounded-full mr-1 inline-block" style={{ backgroundColor: entry.category.color ?? '#888' }} />
              {entry.category.name}
            </Badge>
          )}
          {canManageAll && isOwnEntry && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{tt.me}</Badge>
          )}
        </div>
        {entry.description && !compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{entry.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground text-sm">{durationLabel}</span>
          {entry.startTime && entry.endTime && <span className="tabular-nums">{entry.startTime} – {entry.endTime}</span>}
          {entry.client && (
            <span className="text-muted-foreground">{entry.client.name}{entry.clientSite ? ` · ${entry.clientSite.name}` : ''}</span>
          )}
          {canManageAll && entry.user && !isOwnEntry && (
            <span className="text-muted-foreground">{entry.user.fullName}</span>
          )}
          {entry.loggedByUser && entry.loggedByUser.id !== entry.userId && (
            <span className="text-muted-foreground/70 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{tt.loggedBy} {entry.loggedByUser.fullName}</span>
          )}
        </div>
      </div>
      {(canEdit || canDelete) && (
        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          {canEdit && (
            <Button
              variant="ghost" size="icon"
              className="h-10 w-10 sm:h-7 sm:w-7 touch-manipulation"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="icon"
              className="h-10 w-10 sm:h-7 sm:w-7 touch-manipulation"
              onClick={() => onDelete(entry)}
            >
              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-destructive" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface TimeEntryFormData {
  projectId?: string | null;
  date: Date;
  hours: number;
  minutes: number;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  description?: string | null;
  isOvertime: boolean;
  clientId?: string | null;
  clientSiteId?: string | null;
  categoryId?: string | null;
}

interface EntryFormProps {
  inDialog?: boolean;
  handleSubmit: UseFormHandleSubmit<TimeEntryFormData>;
  onSubmit: (data: TimeEntryFormData) => void;
  canManageAll: boolean;
  targetUserId: string | null;
  setTargetUserId: (v: string | null) => void;
  members: CompanyMember[];
  currentUser: { id: string; fullName?: string } | null;
  register: UseFormRegister<TimeEntryFormData>;
  errors: FieldErrors<TimeEntryFormData>;
  control: Control<TimeEntryFormData>;
  setValue: UseFormSetValue<TimeEntryFormData>;
  watch: UseFormWatch<TimeEntryFormData>;
  projects: Project[];
  companyClients: Client[];
  companyCategories: TimeEntryCategory[];
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  datePickerOpen: boolean;
  setDatePickerOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  locale: Locale;
  tt: Record<string, string | ((...args: unknown[]) => string)>;
  applyAutoOvertime: (clientId: string | null | undefined, date: Date | undefined | null) => void;
  editingEntry: TimeEntry | null;
  cancelEdit: () => void;
  createMutation: { isPending: boolean };
  updateMutation: { isPending: boolean };
  language: string;
}

function EntryForm({
  inDialog = false,
  handleSubmit,
  onSubmit,
  canManageAll,
  targetUserId,
  setTargetUserId,
  members,
  currentUser,
  register,
  errors,
  control,
  setValue,
  watch,
  projects,
  companyClients,
  companyCategories,
  showAdvanced,
  setShowAdvanced,
  datePickerOpen,
  setDatePickerOpen,
  locale,
  tt,
  applyAutoOvertime,
  editingEntry,
  cancelEdit,
  createMutation,
  updateMutation,
  language,
}: EntryFormProps) {
  const watchedClientId = watch('clientId');
  const watchedDate = watch('date');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Log For (owner/admin only) */}
      {canManageAll && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{tt.logFor}</Label>
          <Select value={targetUserId || '_self'} onValueChange={(v) => setTargetUserId(v === '_self' ? null : v)}>
            <SelectTrigger className={cn('text-base', inDialog ? 'h-12' : 'h-10')}>
              <SelectValue placeholder={tt.myself} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_self">{tt.myself}</SelectItem>
              {members.filter(m => m.user?.id !== currentUser?.id).map((m) => {
                const displayName = m.user?.fullName || [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email;
                return <SelectItem key={m.user?.id} value={m.user?.id ?? ''}>{displayName}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{tt.whatDidYouDo}</Label>
        <Input
          placeholder={tt.placeholder}
          className={cn('text-base', inDialog ? 'h-12' : 'h-10')}
          autoComplete="off"
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{tt.hours}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number" min="0" max="23" placeholder="0"
            inputMode="numeric"
            className="text-center text-base font-semibold h-11 flex-1"
            {...register('hours', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground font-medium shrink-0">h</span>
          <Input
            type="number" min="0" max="59" placeholder="0"
            inputMode="numeric"
            className="text-center text-base font-semibold h-11 flex-1"
            {...register('minutes', { setValueAs: (v) => v === '' || v === undefined ? 0 : parseInt(v, 10) })}
          />
          <span className="text-sm text-muted-foreground font-medium shrink-0">min</span>
        </div>
        {errors.hours && <p className="text-xs text-destructive">{errors.hours.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{tt.date}</Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDatePickerOpen(o => !o)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation',
                  inDialog ? 'h-12 text-base' : 'h-10',
                  datePickerOpen && 'ring-2 ring-ring',
                )}
              >
                <span className={field.value ? 'text-foreground' : 'text-muted-foreground'}>
                  {field.value ? format(field.value, 'PPP', { locale }) : tt.date}
                </span>
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
              {datePickerOpen && (
                <div className="mt-1.5 rounded-2xl ring-1 ring-border bg-popover text-popover-foreground shadow-2xl overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(d) => {
                      if (d) {
                        field.onChange(d);
                        setDatePickerOpen(false);
                        applyAutoOvertime(watchedClientId, d);
                      }
                    }}
                    locale={locale}
                    classNames={{
                      months: 'flex flex-col',
                      month: 'space-y-2',
                      caption: 'flex justify-center pt-2 pb-1 relative items-center',
                      caption_label: 'text-sm font-semibold capitalize',
                      nav: 'space-x-1 flex items-center',
                      nav_button: cn(
                        'h-7 w-7 bg-transparent p-0 rounded-lg border border-input hover:bg-accent inline-flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity'
                      ),
                      nav_button_previous: 'absolute left-2',
                      nav_button_next: 'absolute right-2',
                      table: 'w-full border-collapse',
                      head_row: 'flex',
                      head_cell: 'text-muted-foreground w-9 font-normal text-[0.75rem] text-center py-1',
                      row: 'flex w-full mt-1',
                      cell: 'w-9 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
                      day: 'h-9 w-9 p-0 font-normal rounded-lg hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100 inline-flex items-center justify-center transition-colors',
                      day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                      day_today: 'bg-accent text-accent-foreground font-semibold',
                      day_outside: 'text-muted-foreground opacity-40',
                      day_disabled: 'text-muted-foreground opacity-30',
                      day_hidden: 'invisible',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        />
      </div>

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between h-9 px-2 text-sm text-muted-foreground">
            {tt.advancedOptions}
            <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{tt.description}</Label>
            <Textarea
              placeholder={tt.descriptionPlaceholder}
              rows={3}
              className="resize-none text-base"
              {...register('description')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{tt.project}</Label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '_none'} onValueChange={(v) => field.onChange(v === '_none' ? null : v)}>
                  <SelectTrigger className={cn('text-base', inDialog ? 'h-12' : 'h-10')}>
                    <SelectValue placeholder={tt.noProject} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{tt.noProject}</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{tt.startTime}</Label>
              <Input type="time" className={cn('text-base', inDialog ? 'h-12' : 'h-10')} {...register('startTime')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{tt.endTime}</Label>
              <Input type="time" className={cn('text-base', inDialog ? 'h-12' : 'h-10')} {...register('endTime')} />
            </div>
          </div>
          {/* Client */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{tt.client}</Label>
              {watchedClientId && (() => {
                const c = companyClients.find(x => x.id === watchedClientId);
                if (!c?.isDefault) return null;
                return <span className="flex items-center gap-1 text-xs text-primary"><Pin className="h-3 w-3 fill-current" /><span>Predeterminado</span></span>;
              })()}
            </div>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '_none'} onValueChange={(v) => { const id = v === '_none' ? null : v; field.onChange(id); setValue('clientSiteId', null); applyAutoOvertime(id, watchedDate); }}>
                  <SelectTrigger className={cn('text-base', inDialog ? 'h-12' : 'h-10')}>
                    <SelectValue placeholder={tt.noClient} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{tt.noClient}</SelectItem>
                    {companyClients.filter(c => c.isActive).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {/* Client Site */}
          {watchedClientId && (() => {
            const selectedClient = companyClients.find(c => c.id === watchedClientId);
            const activeSites = selectedClient?.sites?.filter(s => s.isActive) ?? [];
            if (activeSites.length === 0) return null;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{tt.clientSite}</Label>
                  {(() => {
                    const siteId = watch('clientSiteId');
                    const site = activeSites.find(s => s.id === siteId);
                    if (!site?.isDefault) return null;
                    return <span className="flex items-center gap-1 text-xs text-primary"><Pin className="h-3 w-3 fill-current" /><span>Predeterminada</span></span>;
                  })()}
                </div>
                <Controller
                  name="clientSiteId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || '_none'} onValueChange={(v) => field.onChange(v === '_none' ? null : v)}>
                      <SelectTrigger className={cn('text-base', inDialog ? 'h-12' : 'h-10')}>
                        <SelectValue placeholder={tt.noSite} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">{tt.noSite}</SelectItem>
                        {activeSites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            );
          })()}
          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{tt.category}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '_none'} onValueChange={(v) => field.onChange(v === '_none' ? null : v)}>
                  <SelectTrigger className={cn('text-base', inDialog ? 'h-12' : 'h-10')}>
                    <SelectValue placeholder={tt.noCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{tt.noCategory}</SelectItem>
                    {companyCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color ?? '#888' }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {/* Overtime toggle */}
          <div className="flex items-center gap-2">
            <Controller
              name="isOvertime"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label className="text-sm cursor-pointer">{tt.overtimeToggle}</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-1.5">
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { const d = new Date(); setValue('date', d); setValue('hours', 8); setValue('minutes', 0); applyAutoOvertime(watchedClientId, d); }}>
          {tt.todayShortcut}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { const d = subDays(new Date(), 1); setValue('date', d); setValue('hours', 8); setValue('minutes', 0); applyAutoOvertime(watchedClientId, d); }}>
          {tt.yesterdayShortcut}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { setValue('hours', 4); setValue('minutes', 0); }}>
          {tt.halfDay}
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        {editingEntry && (
          <Button type="button" variant="outline" onClick={cancelEdit}
            className={cn('flex-1 touch-manipulation', inDialog ? 'h-12 text-base' : 'h-10')}>
            {tt.cancel}
          </Button>
        )}
        <Button
          type="submit"
          className={cn('flex-1 font-semibold touch-manipulation', inDialog ? 'h-12 text-base' : 'h-10')}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {editingEntry ? tt.saveChanges : tt.logHours}
        </Button>
      </div>
    </form>
  );
}

export default function TimeTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, selectedCompany, hasCompanyPermission } = useAuth();
  const { t, language } = useLanguage();
  const tt = t.timeTracker;
  const locale = language === 'es' ? es : enUS;

  const timeEntrySchema = z.object({
    projectId: z.string().optional().nullable(),
    date: z.date({ required_error: tt.validDate }),
    hours: z.number({ invalid_type_error: tt.validHours }).int().min(0, tt.validHours),
    minutes: z.number({ invalid_type_error: tt.validHours }).int().min(0).max(59),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    title: z.string().min(1, tt.validTitle).max(200),
    description: z.string().max(2000).optional().nullable(),
    isOvertime: z.boolean().default(false),
    clientId: z.string().optional().nullable(),
    clientSiteId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
  }).refine(d => d.hours > 0 || d.minutes > 0, { message: tt.validHours, path: ['hours'] });

  const [view, setView] = useState<ViewType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [monthViewMode, setMonthViewMode] = useState<'all' | 'mine'>('all');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const dayStripRef = useRef<HTMLDivElement>(null);
  const defaultsAppliedRef = useRef(false);

  const companyId = selectedCompany?.id ?? '';
  const canManageAll = hasCompanyPermission('TIME:EDIT_ALL', companyId);

  const getDateRange = () => {
    switch (view) {
      case 'daily':
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
      case 'weekly':
        return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      case 'monthly':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  const { data: projectsData } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => projectsService.list({ companyId, page: 1, limit: 100, isActive: true }),
    enabled: !!companyId,
  });
  const projects = projectsData?.data || [];

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['time-entries', companyId, format(rangeStart, 'yyyy-MM-dd'), format(rangeEnd, 'yyyy-MM-dd')],
    queryFn: () =>
      timeEntriesService.list({
        companyId,
        startDate: format(rangeStart, 'yyyy-MM-dd'),
        endDate: format(rangeEnd, 'yyyy-MM-dd'),
        page: 1,
        limit: 500,
      }),
    enabled: !!companyId,
  });
  const entries = entriesData?.data || [];

  // Parallel query: own entries for the same range (only fetched when user can see others' entries)
  const { data: myEntriesData } = useQuery({
    queryKey: ['time-entries', companyId, format(rangeStart, 'yyyy-MM-dd'), format(rangeEnd, 'yyyy-MM-dd'), 'mine'],
    queryFn: () =>
      timeEntriesService.list({
        companyId,
        startDate: format(rangeStart, 'yyyy-MM-dd'),
        endDate: format(rangeEnd, 'yyyy-MM-dd'),
        page: 1,
        limit: 500,
        userId: user?.id,
      }),
    enabled: !!companyId && canManageAll,
  });
  const myEntries = myEntriesData?.data || [];

  const { data: membersData } = useQuery({
    queryKey: ['members', companyId],
    queryFn: () => companyMembersService.getCompanyMembers(companyId),
    enabled: !!companyId && canManageAll,
  });
  const members = membersData ?? [];

  const { data: clientsQueryData } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => clientsService.list({ companyId, page: 1, limit: 200 }),
    enabled: !!companyId,
  });
  const companyClients = clientsQueryData?.data ?? [];

  // Apply default client/site from DB isDefault flags on new entries
  useEffect(() => {
    if (editingEntry) { defaultsAppliedRef.current = false; return; }
    if (defaultsAppliedRef.current || !companyClients.length) return;
    const defaultClient = companyClients.find(c => c.isDefault && c.isActive);
    if (!defaultClient) return;
    setValue('clientId', defaultClient.id);
    const defaultSite = defaultClient.sites?.find(s => s.isDefault && s.isActive);
    if (defaultSite) setValue('clientSiteId', defaultSite.id);
    const d = watch('date');
    if (d) {
      const day = getDay(d);
      if (day === 0 || day === 6) {
        const hasWeekend = defaultClient.rateRules?.some((r) => r.isActive && r.overtimeTriggers?.includes('WEEKEND'));
        if (hasWeekend) { setValue('isOvertime', true); }
      }
    }
    defaultsAppliedRef.current = true;
  }, [editingEntry, companyClients]);

  const { data: categoriesQueryData } = useQuery({
    queryKey: ['time-entry-categories', companyId],
    queryFn: () => categoriesService.list({ companyId }),
    enabled: !!companyId,
  });
  const companyCategories = categoriesQueryData ?? [];

  const createMutation = useMutation({
    mutationFn: timeEntriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: language === 'es' ? 'Imputacion guardada' : 'Entry saved' });
      defaultsAppliedRef.current = false;
      reset();
      setShowAdvanced(false);
      setShowMobileForm(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not save entry' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryDto }) => timeEntriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: language === 'es' ? 'Imputacion actualizada' : 'Entry updated' });
      setEditingEntry(null);
      defaultsAppliedRef.current = false;
      reset();
      setShowAdvanced(false);
      setShowMobileForm(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not update entry' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: timeEntriesService.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['time-entries'] });
      const snapshots = queryClient.getQueriesData<any[]>({ queryKey: ['time-entries'] });
      snapshots.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(key, data.filter((e: any) => e.id !== id));
        }
      });
      return { snapshots };
    },
    onError: (error: any, _id, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not delete entry' });
    },
    onSuccess: () => {
      toast({ title: language === 'es' ? 'Imputacion eliminada' : 'Entry deleted' });
      setDeletingEntry(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });


  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      projectId: null,
      date: new Date(),
      hours: 8,
      minutes: 0,
      startTime: null,
      endTime: null,
      title: '',
      description: '',
      isOvertime: false,
      clientId: null,
      clientSiteId: null,
      categoryId: null,
    },
  });

  useEffect(() => {
    if (editingEntry) {
      const totalMins = Math.round(Number(editingEntry.hours) * 60);
      setValue('projectId', editingEntry.projectId ?? null);
      setValue('date', parseISO(editingEntry.date));
      setValue('hours', Math.floor(totalMins / 60));
      setValue('minutes', totalMins % 60);
      setValue('startTime', editingEntry.startTime ?? null);
      setValue('endTime', editingEntry.endTime ?? null);
      setValue('title', editingEntry.title);
      setValue('description', editingEntry.description ?? '');
      setValue('isOvertime', editingEntry.isOvertime ?? false);
      setValue('clientId', editingEntry.clientId ?? null);
      setValue('clientSiteId', editingEntry.clientSiteId ?? null);
      setValue('categoryId', editingEntry.categoryId ?? null);
      setShowAdvanced(!!(editingEntry.projectId || editingEntry.startTime || editingEntry.clientId || editingEntry.categoryId || editingEntry.isOvertime));
    }
  }, [editingEntry, setValue]);

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const watchedClientId = watch('clientId');
  const watchedDate = watch('date');

  useEffect(() => {
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const totalMins = (eh * 60 + em) - (sh * 60 + sm);
      if (totalMins > 0) {
        setValue('hours', Math.floor(totalMins / 60));
        setValue('minutes', totalMins % 60);
      }
    }
  }, [startTime, endTime, setValue]);

  // Auto-set overtime when date is weekend and selected client has WEEKEND trigger
  const applyAutoOvertime = (clientId: string | null | undefined, date: Date | undefined | null) => {
    if (!clientId || !date) return;
    const day = getDay(date); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) return;
    const selectedClient = companyClients.find((c) => c.id === clientId);
    if (!selectedClient) return;
    const hasWeekendTrigger = selectedClient.rateRules?.some(
      (r) => r.isActive && r.overtimeTriggers?.includes('WEEKEND')
    );
    if (hasWeekendTrigger) {
      setValue('isOvertime', true);
    }
  };

  // Scroll today into view when strip renders
  useEffect(() => {
    if (view === 'daily' && dayStripRef.current) {
      const todayBtn = dayStripRef.current.querySelector('[data-today="true"]');
      todayBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [view, selectedDate]);

  const onSubmit = (data: TimeEntryFormData) => {
    if (!companyId) {
      toast({ variant: 'destructive', title: tt.selectCompany });
      return;
    }
    const payload = {
      projectId: data.projectId || null,
      date: format(data.date, 'yyyy-MM-dd'),
      hours: Number((data.hours + data.minutes / 60).toFixed(4)),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      title: data.title,
      description: data.description || null,
      isOvertime: data.isOvertime ?? false,
      clientId: data.clientId || null,
      clientSiteId: data.clientSiteId || null,
      categoryId: data.categoryId || null,
    };
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: payload });
    } else {
      createMutation.mutate({ companyId, ...payload, ...(targetUserId ? { targetUserId } : {}) });
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setTargetUserId(null);
    defaultsAppliedRef.current = false;
    reset({ projectId: null, date: new Date(), hours: 8, minutes: 0, startTime: null, endTime: null, title: '', description: '', isOvertime: false, clientId: null, clientSiteId: null, categoryId: null });
    setShowAdvanced(false);
    setShowMobileForm(false);
  };

  const openEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    if (view !== 'daily') { setView('daily'); setSelectedDate(parseISO(entry.date)); }
    setShowMobileForm(true);
  };

  const handlePrev = () => {
    if (view === 'daily') setSelectedDate(d => subDays(d, 1));
    else if (view === 'weekly') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
  };

  const handleNext = () => {
    if (view === 'daily') setSelectedDate(d => addDays(d, 1));
    else if (view === 'weekly') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
  };

  const goToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentDate(now);
  };

  const getPeriodLabel = () => {
    if (view === 'daily') return format(selectedDate, 'EEE, MMM d', { locale });
    if (view === 'weekly') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d', { locale })} – ${format(e, 'MMM d', { locale })}`;
    }
    return format(currentDate, 'MMM yyyy', { locale });
  };

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  const grouped = entries.reduce((acc, e) => {
    const k = format(parseISO(e.date), 'yyyy-MM-dd');
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const dayEntries = grouped[format(selectedDate, 'yyyy-MM-dd')] || [];

  const weekDays = view === 'weekly'
    ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    : [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = view === 'monthly' ? eachDayOfInterval({ start: calStart, end: calEnd }) : [];

  const weekDayLabels = language === 'es'
    ? ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Day strip: 6 days before selected + 7 days after
  const dayStripDays = eachDayOfInterval({ start: subDays(selectedDate, 6), end: addDays(selectedDate, 7) });

  const entryFormProps: EntryFormProps = {
    handleSubmit,
    onSubmit,
    canManageAll,
    targetUserId,
    setTargetUserId,
    members,
    currentUser: user,
    register,
    errors,
    control,
    setValue,
    watch,
    projects,
    companyClients,
    companyCategories,
    showAdvanced,
    setShowAdvanced,
    datePickerOpen,
    setDatePickerOpen,
    locale,
    tt,
    applyAutoOvertime,
    editingEntry,
    cancelEdit,
    createMutation,
    updateMutation,
    language,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-5xl mx-auto pb-24 lg:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              {tt.title}
            </h1>
            {selectedCompany && (
              <p className="text-sm text-muted-foreground mt-0.5">{selectedCompany.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {canManageAll && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{tt.myHours}</p>
                <p className="font-bold text-base text-foreground leading-none">
                  {myEntries.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h
                </p>
              </div>
            )}
            {canManageAll && <div className="h-8 w-px bg-border" />}
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{canManageAll ? tt.total : tt.subtitle}</p>
                <p className="font-bold text-base text-foreground leading-none">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </div>

        {!companyId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">{tt.selectCompany}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">

            <div className="hidden lg:block space-y-3">
              <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {editingEntry ? tt.editEntry : tt.newEntry}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <EntryForm {...entryFormProps} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 min-w-0">

              {/* View tabs + navigation */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="flex-1 sm:flex-none">
                  <TabsList className="h-10 w-full sm:w-auto">
                    <TabsTrigger value="daily" className="flex-1 sm:flex-none text-sm h-9 px-4">{tt.day}</TabsTrigger>
                    <TabsTrigger value="weekly" className="flex-1 sm:flex-none text-sm h-9 px-4">{tt.week}</TabsTrigger>
                    <TabsTrigger value="monthly" className="flex-1 sm:flex-none text-sm h-9 px-4">{tt.month}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-1 flex-1 justify-end">
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 touch-manipulation" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="h-10 text-sm font-semibold capitalize min-w-0 flex-1 sm:min-w-[160px] sm:flex-none truncate touch-manipulation"
                    onClick={goToday}
                  >
                    {getPeriodLabel()}
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 touch-manipulation" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day strip – horizontal scrollable date picker shown in daily view */}
              {view === 'daily' && (
                <div className="w-full overflow-hidden">
                  <div
                    ref={dayStripRef}
                    className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                  {dayStripDays.map(day => {
                    const k = format(day, 'yyyy-MM-dd');
                    const dayTotal = (grouped[k] || []).reduce((s, e) => s + Number(e.hours), 0);
                    const sel = isSameDay(day, selectedDate);
                    const tod = isToday(day);
                    return (
                      <button
                        key={k}
                        type="button"
                        data-today={tod ? 'true' : undefined}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'snap-start flex-none flex flex-col items-center gap-0.5 py-2 px-2.5 rounded-xl border transition-colors touch-manipulation min-w-[3.25rem]',
                          sel
                            ? 'bg-primary text-primary-foreground border-primary'
                            : tod
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-transparent bg-muted/40 hover:bg-accent'
                        )}
                      >
                        <span className={cn('text-[10px] font-medium uppercase tracking-wide', sel ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {format(day, 'EEE', { locale }).slice(0, 3)}
                        </span>
                        <span className={cn('text-base font-bold leading-none', sel ? 'text-primary-foreground' : tod ? 'text-primary' : '')}>
                          {format(day, 'd')}
                        </span>
                        <span className={cn(
                          'text-[9px] font-semibold leading-none mt-0.5',
                          dayTotal > 0
                            ? sel ? 'text-primary-foreground/80' : 'text-green-600 dark:text-green-400'
                            : 'opacity-0'
                        )}>
                          {dayTotal > 0 ? (dayTotal % 1 === 0 ? dayTotal : dayTotal.toFixed(1)) + 'h' : '·'}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {view === 'daily' && (
                    <div className="space-y-2">
                      {dayEntries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium">{tt.noEntriesDay}</p>
                          <p className="text-sm mt-1">{tt.noEntriesHint}</p>
                          <Button
                            size="sm"
                            className="mt-4 lg:hidden touch-manipulation"
                            onClick={() => {
                              setValue('date', selectedDate);
                              setEditingEntry(null);
                              setShowMobileForm(true);
                            }}
                          >
                            {tt.logHours}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayEntries.map(e => <EntryCard key={e.id} entry={e} currentUserId={user?.id} canManageAll={canManageAll} tt={tt} onEdit={openEditEntry} onDelete={setDeletingEntry} />)}
                        </div>
                      )}
                      {dayEntries.length > 0 && (
                        <div className="flex items-center justify-between pt-1 px-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="lg:hidden h-9 touch-manipulation"
                            onClick={() => {
                              setValue('date', selectedDate);
                              setEditingEntry(null);
                              setShowMobileForm(true);
                            }}
                          >
                            {tt.logHours}
                          </Button>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {tt.total}: <strong>{dayEntries.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {view === 'weekly' && (
                    <div className="space-y-2">
                      {weekDays.map(day => {
                        const k = format(day, 'yyyy-MM-dd');
                        const dayEs = grouped[k] || [];
                        const total = dayEs.reduce((s, e) => s + Number(e.hours), 0);
                        return (
                          <div key={k} className={cn('border rounded-xl overflow-hidden', isToday(day) && 'border-primary')}>
                            <button
                              type="button"
                              className={cn(
                                'w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-accent/30 transition-colors touch-manipulation',
                                isToday(day) && 'bg-primary/5'
                              )}
                              onClick={() => { setSelectedDate(day); setView('daily'); }}
                            >
                              <span className={cn('text-sm font-semibold capitalize', isToday(day) && 'text-primary')}>
                                {format(day, 'EEEE, MMM d', { locale })}
                                {isToday(day) && <span className="ml-2 text-xs font-normal opacity-70">({tt.today})</span>}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={cn('text-sm font-bold', total > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                                  {total > 0 ? `${total.toFixed(1)}h` : '–'}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </button>
                            {dayEs.length > 0 && (
                              <div className="px-3 pb-3 space-y-2 border-t bg-muted/10">
                                {dayEs.map(e => <EntryCard key={e.id} entry={e} compact currentUserId={user?.id} canManageAll={canManageAll} tt={tt} onEdit={openEditEntry} onDelete={setDeletingEntry} />)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between text-sm px-1 pt-1">
                        <span className="text-muted-foreground">{tt.total}</span>
                        <span className="font-bold">{totalHours.toFixed(1)}h</span>
                      </div>
                    </div>
                  )}

                  {view === 'monthly' && (
                    <div>
                      {/* View mode toggle: owner/admin see all or just their own */}
                      {canManageAll && (
                        <div className="flex items-center justify-end mb-3 gap-2">
                          <span className="text-xs text-muted-foreground">{tt.viewMode}:</span>
                          <div className="flex rounded-lg border overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setMonthViewMode('all')}
                              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', monthViewMode === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                            >{tt.showAll}</button>
                            <button
                              type="button"
                              onClick={() => setMonthViewMode('mine')}
                              className={cn('px-3 py-1.5 text-xs font-medium transition-colors border-l', monthViewMode === 'mine' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                            >{tt.showMine}</button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-7 mb-1">
                        {weekDayLabels.map(d => (
                          <div key={d} className="text-center text-xs text-muted-foreground font-semibold py-1.5">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calDays.map(day => {
                          const k = format(day, 'yyyy-MM-dd');
                          const dayEs = (monthViewMode === 'mine' && canManageAll)
                            ? (grouped[k] || []).filter(e => e.userId === user?.id)
                            : (grouped[k] || []);
                          const total = dayEs.reduce((s, e) => s + Number(e.hours), 0);
                          const inMonth = isSameMonth(day, currentDate);
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => { setSelectedDate(day); setView('daily'); }}
                              className={cn(
                                'aspect-square rounded-xl flex flex-col items-center justify-center transition-colors text-center border touch-manipulation',
                                inMonth ? 'bg-card hover:bg-accent/50' : 'bg-muted/20 text-muted-foreground border-transparent',
                                isToday(day) && 'border-primary ring-1 ring-primary',
                                isSameDay(day, selectedDate) && 'bg-primary/10',
                                total > 0 && inMonth && 'border-green-500/40'
                              )}
                            >
                              <span className={cn('text-xs sm:text-sm font-semibold', isToday(day) && 'text-primary')}>
                                {format(day, 'd')}
                              </span>
                              {total > 0 && inMonth && (
                                <span className="text-[9px] sm:text-[10px] font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                                  {total % 1 === 0 ? total : total.toFixed(1)}h
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {(() => {
                            const displayEntries = (monthViewMode === 'mine' && canManageAll) ? entries.filter(e => e.userId === user?.id) : entries;
                            return `${displayEntries.length} ${tt.entriesIn} ${format(currentDate, 'MMMM', { locale })}`;
                          })()}
                        </span>
                        <span className="font-bold">
                          {(() => {
                            const displayEntries = (monthViewMode === 'mine' && canManageAll) ? entries.filter(e => e.userId === user?.id) : entries;
                            return `${displayEntries.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h ${tt.totalHours}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!!companyId && (
        <div className="fixed bottom-6 right-5 z-50 lg:hidden">
          <Button
            className="h-14 w-14 p-0 rounded-full shadow-xl touch-manipulation"
            onClick={() => {
              setEditingEntry(null);
              reset({ projectId: null, date: selectedDate, hours: 8, minutes: 0, startTime: null, endTime: null, title: '', description: '', isOvertime: false, clientId: null, clientSiteId: null, categoryId: null });
              setTargetUserId(null);
              setShowAdvanced(false);
              setShowMobileForm(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      <Dialog open={showMobileForm} onOpenChange={(open) => { if (!open) cancelEdit(); }}>
        <DialogContent
          className="p-0 gap-0 max-h-[90dvh] flex flex-col w-[calc(100vw-2rem)] sm:w-full max-w-lg rounded-2xl sm:rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-base font-semibold">
              {editingEntry ? tt.editEntry : tt.newEntry}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <EntryForm {...entryFormProps} inDialog />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt.deleteConfirm} "<strong>{deletingEntry?.title}</strong>"? {tt.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tt.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}