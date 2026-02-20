import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { timeEntriesService } from '@/services/time-entries.service';
import { projectsService } from '@/services/projects.service';
import type { TimeEntry } from '@/types/time-tracker.types';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function TimeTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, selectedCompany, isOwnerOf } = useAuth();
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

  const companyId = selectedCompany?.id ?? '';
  const isOwner = isOwnerOf(companyId);

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

  const createMutation = useMutation({
    mutationFn: timeEntriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'Entry saved' });
      reset();
      setShowAdvanced(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not save entry' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => timeEntriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'Entry updated' });
      setEditingEntry(null);
      reset();
      setShowAdvanced(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Could not update entry' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: timeEntriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'Entry deleted' });
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
    if (view === 'daily') return format(selectedDate, 'EEEE, MMMM d, yyyy', { locale });
    if (view === 'weekly') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d', { locale })} - ${format(e, 'MMM d, yyyy', { locale })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale });
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

  const EntryCard = ({ entry, compact = false }: { entry: TimeEntry; compact?: boolean }) => {
    const isOwnEntry = entry.userId === user?.id;
    return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group',
      compact && 'p-2',
      isOwner && isOwnEntry && 'border-primary/40 bg-primary/5'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('font-semibold truncate', compact ? 'text-xs' : 'text-sm')}>{entry.title}</span>
          {entry.project && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0" style={{ borderColor: entry.project.color ?? undefined }}>
              {entry.project.name}
            </Badge>
          )}
          {isOwner && isOwnEntry && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Me</Badge>
          )}
        </div>
        {entry.description && !compact && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{entry.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{Number(entry.hours).toFixed(1)}h</span>
          {entry.startTime && entry.endTime && <span>{entry.startTime} - {entry.endTime}</span>}
          {isOwner && entry.user && !isOwnEntry && (
            <span className="text-muted-foreground">{entry.user.fullName}</span>
          )}
        </div>
      </div>
      {(!isOwner || isOwnEntry) && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="icon" className="h-6 w-6"
            onClick={() => {
              setEditingEntry(entry);
              if (view !== 'daily') { setView('daily'); setSelectedDate(parseISO(entry.date)); }
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeletingEntry(entry)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              {tt.title}
            </h1>
            {selectedCompany && (
              <p className="text-sm text-muted-foreground mt-0.5">{selectedCompany.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-semibold text-foreground text-base">{totalHours.toFixed(1)}h</span>
            <span>{tt.subtitle}</span>
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
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            {/* Form */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {editingEntry ? tt.editEntry : tt.newEntry}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{tt.whatDidYouDo}</Label>
                      <Input placeholder={tt.placeholder} className="text-sm" {...register('title')} />
                      {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">{tt.hours}</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min="0" max="23" placeholder="8"
                          className="text-sm"
                          {...register('hours', { valueAsNumber: true })}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">h</span>
                        <Input
                          type="number" min="0" max="59" placeholder="0"
                          className="text-sm"
                          {...register('minutes', { setValueAs: (v) => v === '' || v === undefined ? 0 : parseInt(v, 10) })}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">min</span>
                      </div>
                        {errors.hours && <p className="text-xs text-destructive">{errors.hours.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">{tt.date}</Label>
                        <Controller
                          name="date"
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="date"
                              value={format(field.value, 'yyyy-MM-dd')}
                              onChange={(e) => field.onChange(new Date(e.target.value + 'T12:00:00'))}
                              className="text-sm"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between h-7 px-2 text-xs text-muted-foreground">
                          {tt.advancedOptions}
                          <ChevronDown className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">{tt.description}</Label>
                          <Textarea
                            placeholder={tt.descriptionPlaceholder}
                            rows={2}
                            className="resize-none text-sm"
                            {...register('description')}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">{tt.project}</Label>
                          <Controller
                            name="projectId"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || '_none'} onValueChange={(v) => field.onChange(v === '_none' ? null : v)}>
                                <SelectTrigger className="text-sm h-8">
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
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{tt.startTime}</Label>
                            <Input type="time" className="text-sm h-8" {...register('startTime')} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{tt.endTime}</Label>
                            <Input type="time" className="text-sm h-8" {...register('endTime')} />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex gap-2 pt-1">
                      {editingEntry && (
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit} className="flex-1">
                          {tt.cancel}
                        </Button>
                      )}
                      <Button
                        type="submit" size="sm" className="flex-1"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {(createMutation.isPending || updateMutation.isPending) && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        {editingEntry ? tt.saveChanges : tt.logHours}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Quick shortcuts */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => { setValue('date', new Date()); setValue('hours', 8); setValue('minutes', 0); }}>
                  {tt.todayShortcut}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => { setValue('date', subDays(new Date(), 1)); setValue('hours', 8); setValue('minutes', 0); }}>
                  {tt.yesterdayShortcut}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => { setValue('hours', 4); setValue('minutes', 0); }}>
                  {tt.halfDay}
                </Button>
              </div>
            </div>

            {/* Calendar / List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="daily" className="text-xs h-7">{tt.day}</TabsTrigger>
                    <TabsTrigger value="weekly" className="text-xs h-7">{tt.week}</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs h-7">{tt.month}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handlePrev}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-medium min-w-[180px] capitalize" onClick={goToday}>
                    {getPeriodLabel()}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleNext}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

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
                        <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                          {tt.noEntriesDay}<br />
                          <span className="text-xs">{tt.noEntriesHint}</span>
                        </div>
                      ) : (
                        dayEntries.map(e => <EntryCard key={e.id} entry={e} />)
                      )}
                      {dayEntries.length > 0 && (
                        <div className="flex justify-end">
                          <span className="text-xs text-muted-foreground">
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
                          <div key={k} className={cn('border rounded-lg overflow-hidden', isToday(day) && 'border-primary')}>
                            <button
                              type="button"
                              className={cn('w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent/30 transition-colors', isToday(day) && 'bg-primary/5')}
                              onClick={() => { setSelectedDate(day); setView('daily'); }}
                            >
                              <span className={cn('text-sm font-medium capitalize', isToday(day) && 'text-primary')}>
                                {format(day, 'EEEE, MMM d', { locale })}
                                {isToday(day) && <span className="ml-2 text-xs">({tt.today})</span>}
                              </span>
                              <span className={cn('text-sm font-semibold', total > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                                {total > 0 ? `${total.toFixed(1)}h` : '-'}
                              </span>
                            </button>
                            {dayEs.length > 0 && (
                              <div className="px-2 pb-2 space-y-1 border-t bg-muted/10">
                                {dayEs.map(e => <EntryCard key={e.id} entry={e} compact />)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MONTHLY */}
                  {view === 'monthly' && (
                    <div>
                      <div className="grid grid-cols-7 mb-1">
                        {weekDayLabels.map(d => (
                          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
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
                                'aspect-square rounded-lg p-1 flex flex-col items-center justify-center transition-colors text-center border',
                                inMonth ? 'bg-card hover:bg-accent/50' : 'bg-muted/20 text-muted-foreground border-transparent',
                                isToday(day) && 'border-primary ring-1 ring-primary',
                                isSameDay(day, selectedDate) && 'bg-primary/10',
                                total > 0 && inMonth && 'border-green-500/40'
                              )}
                            >
                              <span className={cn('text-xs font-medium', isToday(day) && 'text-primary')}>
                                {format(day, 'd')}
                              </span>
                              {total > 0 && inMonth && (
                                <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 leading-none mt-0.5">
                                  {total.toFixed(total % 1 === 0 ? 0 : 1)}h
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
                        <span className="font-semibold">{totalHours.toFixed(1)}h {tt.totalHours}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

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