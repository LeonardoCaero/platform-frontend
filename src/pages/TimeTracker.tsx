import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
} from 'date-fns';
import { enUS, es } from 'date-fns/locale';
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
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { timeEntriesService } from '@/services/time-entries.service';
import { projectsService } from '@/services/projects.service';
import type { TimeEntry } from '@/types/time-tracker.types';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Clock, Plus, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_HOURS = [1, 2, 4, 6, 8];

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function TimeTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, selectedCompany, isOwnerOf, isPlatformAdmin } = useAuth();
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
  }).refine(d => d.hours > 0 || d.minutes > 0, { message: tt.validHours, path: ['hours'] });

  type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

  const [view, setView] = useState<ViewType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const dayStripRef = useRef<HTMLDivElement>(null);

  const companyId = selectedCompany?.id ?? '';
  const isOwner = isOwnerOf(companyId);
  const canManageAll = isOwner || isPlatformAdmin;

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

  const createMutation = useMutation({
    mutationFn: timeEntriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: language === 'es' ? 'Imputacion guardada' : 'Entry saved' });
      reset();
      setShowAdvanced(false);
      setShowMobileForm(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not save entry' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => timeEntriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: language === 'es' ? 'Imputacion actualizada' : 'Entry updated' });
      setEditingEntry(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: language === 'es' ? 'Imputacion eliminada' : 'Entry deleted' });
      setDeletingEntry(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not delete entry' });
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
      setShowAdvanced(!!(editingEntry.projectId || editingEntry.startTime));
    }
  }, [editingEntry, setValue]);

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const watchedHours = watch('hours');
  const watchedMinutes = watch('minutes');

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
    };
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: payload });
    } else {
      createMutation.mutate({ companyId, ...payload });
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    reset({ projectId: null, date: new Date(), hours: 8, minutes: 0, startTime: null, endTime: null, title: '', description: '' });
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

  const EntryCard = ({ entry, compact = false }: { entry: TimeEntry; compact?: boolean }) => {
    const isOwnEntry = entry.userId === user?.id;
    const canDelete = isOwnEntry || canManageAll;
    const canEdit = isOwnEntry || isPlatformAdmin;
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
          {canManageAll && entry.user && !isOwnEntry && (
            <span className="text-muted-foreground">{entry.user.fullName}</span>
          )}
        </div>
      </div>
      {(canEdit || canDelete) && (
        /* Always visible on mobile, hover-only on desktop */
        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          {canEdit && (
            <Button
              variant="ghost" size="icon"
              className="h-10 w-10 sm:h-7 sm:w-7 touch-manipulation"
              onClick={() => openEditEntry(entry)}
            >
              <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="icon"
              className="h-10 w-10 sm:h-7 sm:w-7 touch-manipulation"
              onClick={() => setDeletingEntry(entry)}
            >
              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-destructive" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
  };

  // ---------- Quick Hours Buttons ----------
  const QuickHourButtons = () => (
    <div className="flex gap-1.5 flex-wrap">
      {QUICK_HOURS.map(h => {
        const active = watchedHours === h && watchedMinutes === 0;
        return (
          <button
            key={h}
            type="button"
            onClick={() => { setValue('hours', h); setValue('minutes', 0); }}
            className={cn(
              'flex-1 min-w-[2.5rem] py-2.5 rounded-lg border text-sm font-bold transition-colors touch-manipulation select-none',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-border text-foreground'
            )}
          >
            {h}h
          </button>
        );
      })}
    </div>
  );

  // ---------- Entry Form ----------
  const EntryForm = ({ inDialog = false }: { inDialog?: boolean }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
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

      {/* Quick hours */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{tt.hours}</Label>
        <QuickHourButtons />
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

      {/* Date */}
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

      {/* Advanced */}
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
        </CollapsibleContent>
      </Collapsible>

      {/* Quick shortcuts */}
      <div className="flex gap-1.5">
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { setValue('date', new Date()); setValue('hours', 8); setValue('minutes', 0); }}>
          {tt.todayShortcut}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { setValue('date', subDays(new Date(), 1)); setValue('hours', 8); setValue('minutes', 0); }}>
          {tt.yesterdayShortcut}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs touch-manipulation"
          onClick={() => { setValue('hours', 4); setValue('minutes', 0); }}>
          {tt.halfDay}
        </Button>
      </div>

      {/* Submit */}
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

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-5xl mx-auto pb-24 lg:pb-8">
        {/* Header */}
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

            {/* ===== Desktop Form (left column, hidden on mobile) ===== */}
            <div className="hidden lg:block space-y-3">
              <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {editingEntry ? tt.editEntry : tt.newEntry}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <EntryForm />
                </CardContent>
              </Card>
            </div>

            {/* ===== Calendar / List ===== */}
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
                  {/* DAILY */}
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
                          {dayEntries.map(e => <EntryCard key={e.id} entry={e} />)}
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

                  {/* WEEKLY */}
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
                                {dayEs.map(e => <EntryCard key={e.id} entry={e} compact />)}
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

                  {/* MONTHLY */}
                  {view === 'monthly' && (
                    <div>
                      <div className="grid grid-cols-7 mb-1">
                        {weekDayLabels.map(d => (
                          <div key={d} className="text-center text-xs text-muted-foreground font-semibold py-1.5">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calDays.map(day => {
                          const k = format(day, 'yyyy-MM-dd');
                          const dayEs = grouped[k] || [];
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
                          {entries.length} {tt.entriesIn} {format(currentDate, 'MMMM', { locale })}
                        </span>
                        <span className="font-bold">{totalHours.toFixed(1)}h {tt.totalHours}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Mobile FAB ===== */}
      {!!companyId && (
        <div className="fixed bottom-6 right-5 z-50 lg:hidden">
          <Button
            className="h-14 w-14 p-0 rounded-full shadow-xl touch-manipulation"
            onClick={() => {
              setEditingEntry(null);
              reset({ projectId: null, date: selectedDate, hours: 8, minutes: 0, startTime: null, endTime: null, title: '', description: '' });
              setShowAdvanced(false);
              setShowMobileForm(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* ===== Mobile Form Dialog ===== */}
      <Dialog open={showMobileForm} onOpenChange={(open) => { if (!open) cancelEdit(); }}>
        <DialogContent className="p-0 gap-0 max-h-[90dvh] flex flex-col w-[calc(100vw-2rem)] sm:w-full max-w-lg rounded-2xl sm:rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-base font-semibold">
              {editingEntry ? tt.editEntry : tt.newEntry}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <EntryForm inDialog />
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
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