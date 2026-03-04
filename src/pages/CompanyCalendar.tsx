import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  eachDayOfInterval,
} from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { calendarNotesService } from '@/services/calendar-notes.service';
import { companyMembersService } from '@/services/company-members.service';
import type { CalendarNote } from '@/types/calendar.types';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2, CalendarDays, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── colour palette for notes ─────────────────────────────────────────────────
const NOTE_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#64748B', // slate
];

// ─── Zod schema ───────────────────────────────────────────────────────────────
const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().max(5000).optional(),
  color: z.string().optional(),
  assigneeUserIds: z.array(z.string()).optional().default([]),
});
type NoteFormValues = z.infer<typeof noteFormSchema>;

// ─── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: CalendarNote;
  canEdit: boolean;
  onEdit: (note: CalendarNote) => void;
  onDelete: (note: CalendarNote) => void;
  cl: Record<string, string>;
}
function NoteCard({ note, canEdit, onEdit, onDelete, cl }: NoteCardProps) {
  const hasAssignees = note.assignees.length > 0;
  return (
    <div
      className="flex gap-3 rounded-xl border bg-card p-3.5 group transition-colors"
      style={{ borderLeftColor: note.color ?? '#6366F1', borderLeftWidth: 4 }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug">{note.title}</p>
        {note.content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">{note.content}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {hasAssignees ? (
            <div className="flex -space-x-1.5">
              {note.assignees.slice(0, 5).map(a => (
                <Avatar key={a.userId} className="h-5 w-5 border border-background ring-0">
                  <AvatarImage src={a.user.avatar ?? undefined} />
                  <AvatarFallback className="text-[9px]">{getInitials(a.user.fullName)}</AvatarFallback>
                </Avatar>
              ))}
              {note.assignees.length > 5 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] border border-background">
                  +{note.assignees.length - 5}
                </span>
              )}
            </div>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Users className="h-2.5 w-2.5 mr-0.5" />
              {cl.everyone}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {note.createdBy.fullName}
          </span>
        </div>
      </div>
      {canEdit && (
        <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(note)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(note)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CompanyCalendar() {
  const { user, selectedCompany, isAdminOf, isOwnerOf } = useAuth();
  const { t, language } = useLanguage();
  const cl = t.calendar;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = selectedCompany?.id;
  const dateLocale = language === 'es' ? esLocale : enUS;
  // Owners/admins can manage anyone's notes and assign to any member
  const canManage = companyId
    ? (isOwnerOf(companyId) || isAdminOf(companyId) || (user?.isPlatformAdmin ?? false))
    : false;
  // Any member can create notes (self-assigned) and edit/delete their own
  const canCreate = !!companyId;

  // ─── state ─────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarNote | null>(null);
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [memberSearch, setMemberSearch] = useState('');

  // ─── calendar grid ──────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // ─── query: fetch notes for the visible month range ─────────────────────
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['calendar-notes', companyId, format(currentMonth, 'yyyy-MM')],
    queryFn: () => calendarNotesService.list({
      companyId: companyId!,
      startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
    }),
    enabled: !!companyId,
  });

  // ─── query: company members ─────────────────────────────────────────────
  const { data: members = [] } = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: () => companyMembersService.getCompanyMembers(companyId!),
    enabled: !!companyId && noteFormOpen,
  });

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(m =>
      `${m.user.firstName} ${m.user.lastName ?? ''}`.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // ─── get notes for a specific day ───────────────────────────────────────
  const notesForDay = (day: Date) =>
    notes.filter(n => isSameDay(new Date(n.date), day));

  const selectedDayNotes = selectedDay ? notesForDay(selectedDay) : [];

  // ─── form ────────────────────────────────────────────────────────────────
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { title: '', content: '', color: NOTE_COLORS[0], assigneeUserIds: [] },
  });

  const openCreateForm = (day: Date) => {
    setSelectedDay(day);
    setEditingNote(null);
    // Regular members are auto-assigned to themselves; admins start with empty selection
    form.reset({ title: '', content: '', color: NOTE_COLORS[0], assigneeUserIds: canManage ? [] : [user!.id] });
    setSelectedColor(NOTE_COLORS[0]);
    setMemberSearch('');
    setNoteFormOpen(true);
  };

  const openEditForm = (note: CalendarNote) => {
    setEditingNote(note);
    const color = note.color ?? NOTE_COLORS[0];
    form.reset({
      title: note.title,
      content: note.content ?? '',
      color,
      // Regular members cannot change assignees — backend will enforce [callerId]
      assigneeUserIds: canManage ? note.assignees.map(a => a.userId) : [user!.id],
    });
    setSelectedColor(color);
    setMemberSearch('');
    setNoteFormOpen(true);
  };

  // ─── mutations ───────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-notes', companyId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: NoteFormValues) =>
      calendarNotesService.create({
        companyId: companyId!,
        date: format(selectedDay!, 'yyyy-MM-dd'),
        title: data.title,
        content: data.content || null,
        color: selectedColor,
        assigneeUserIds: data.assigneeUserIds,
      }),
    onSuccess: () => {
      toast({ title: cl.newNote, description: cl.save });
      setNoteFormOpen(false);
      invalidate();
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: NoteFormValues) =>
      calendarNotesService.update(editingNote!.id, {
        title: data.title,
        content: data.content || null,
        color: selectedColor,
        assigneeUserIds: data.assigneeUserIds,
      }),
    onSuccess: () => {
      toast({ title: cl.editNote, description: cl.saveChanges });
      setNoteFormOpen(false);
      invalidate();
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarNotesService.delete(id),
    onSuccess: () => {
      toast({ title: cl.deleteNote });
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const onSubmit = (data: NoteFormValues) => {
    if (editingNote) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── day column headers ───────────────────────────────────────────────────
  const dayHeaders = [cl.mon, cl.tue, cl.wed, cl.thu, cl.fri, cl.sat, cl.sun];

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cl.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{cl.subtitle}</p>
          </div>
          {canManage && selectedDay && (
            <Button onClick={() => openCreateForm(selectedDay)} className="gap-2">
              <Plus className="h-4 w-4" />
              {cl.newNote}
            </Button>
          )}
        </div>

        {!companyId ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            <CalendarDays className="h-10 w-10 mr-3 opacity-40" />
            {cl.selectCompany}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
            {/* ── Calendar grid ── */}
            <div className="flex-1 min-w-0">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-base capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {dayHeaders.map(d => (
                  <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border">
                {calendarDays.map(day => {
                  const dayNotes = notesForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDay = isToday(day);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'bg-card relative flex flex-col gap-0.5 p-1.5 min-h-[64px] sm:min-h-[80px] text-left transition-colors hover:bg-accent/50 focus:outline-none',
                        !isCurrentMonth && 'opacity-40',
                        isSelected && 'bg-accent ring-2 ring-inset ring-primary',
                      )}
                    >
                      {/* Day number */}
                      <span className={cn(
                        'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0 self-start',
                        isTodayDay && 'bg-primary text-primary-foreground',
                        !isTodayDay && 'text-foreground',
                      )}>
                        {format(day, 'd')}
                      </span>

                      {/* Note pills */}
                      <div className="flex flex-col gap-0.5 w-full">
                        {isLoading ? (
                          <Skeleton className="h-2.5 w-full rounded-full" />
                        ) : (
                          dayNotes.slice(0, 3).map(n => (
                            <div
                              key={n.id}
                              className="h-2.5 rounded-full truncate text-[9px] leading-[10px] px-1 hidden sm:flex items-center text-white font-medium"
                              style={{ backgroundColor: n.color ?? '#6366F1' }}
                            >
                              <span className="truncate">{n.title}</span>
                            </div>
                          ))
                        )}
                        {/* Mobile: dots indicator */}
                        {dayNotes.length > 0 && (
                          <div className="flex gap-0.5 sm:hidden mt-0.5">
                            {dayNotes.slice(0, 3).map(n => (
                              <div
                                key={n.id}
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: n.color ?? '#6366F1' }}
                              />
                            ))}
                          </div>
                        )}
                        {dayNotes.length > 3 && (
                          <span className="text-[9px] text-muted-foreground hidden sm:block">
                            +{dayNotes.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Day detail panel ── */}
            <div className={cn(
              'lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3',
              !selectedDay && 'hidden lg:flex'
            )}>
              {selectedDay ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold capitalize">
                        {format(selectedDay, 'EEEE', { locale: dateLocale })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(selectedDay, 'd MMMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {canCreate && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openCreateForm(selectedDay)}>
                          <Plus className="h-3.5 w-3.5" />
                          {cl.newNote}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 lg:hidden" onClick={() => setSelectedDay(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                      </>
                    ) : selectedDayNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 gap-2 text-muted-foreground">
                        <CalendarDays className="h-8 w-8 opacity-40" />
                        <p className="text-sm">{cl.noNotes}</p>
                        {canCreate && (
                          <Button size="sm" variant="ghost" onClick={() => openCreateForm(selectedDay)}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            {cl.noNotesHint}
                          </Button>
                        )}
                      </div>
                    ) : (
                      selectedDayNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          canEdit={canManage || note.createdBy.id === user?.id}
                          onEdit={openEditForm}
                          onDelete={n => setDeleteTarget(n)}
                          cl={cl}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground gap-2 rounded-xl border border-dashed p-8">
                  <CalendarDays className="h-8 w-8 opacity-40" />
                  <p className="text-sm text-center">{language === 'es' ? 'Selecciona un día para ver sus notas' : 'Select a day to view its notes'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Note form dialog ── */}
      <Dialog open={noteFormOpen} onOpenChange={setNoteFormOpen}>
        <DialogContent className="p-0 gap-0 max-h-[90dvh] flex flex-col w-[calc(100vw-2rem)] sm:w-full max-w-lg rounded-2xl sm:rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-base font-semibold">
              {editingNote ? cl.editNote : cl.newNote}
              {selectedDay && !editingNote && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {format(selectedDay, 'd MMM yyyy', { locale: dateLocale })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 px-5 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="note-title">{cl.noteTitle}</Label>
              <Input
                id="note-title"
                placeholder={cl.noteTitlePlaceholder}
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{cl.validTitle}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="note-content">{cl.noteContent}</Label>
              <Textarea
                id="note-content"
                placeholder={cl.noteContentPlaceholder}
                rows={3}
                className="resize-none"
                {...form.register('content')}
              />
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <Label>{cl.color}</Label>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Assignees — only admins/owners can pick assignees; members are auto-assigned */}
            {canManage && <div className="space-y-1.5">
              <Label>{cl.assignees}</Label>
              <Input
                placeholder={cl.assigneesPlaceholder}
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
              <div className="max-h-44 overflow-y-auto rounded-lg border divide-y">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    {members.length === 0
                      ? (language === 'es' ? 'Cargando miembros…' : 'Loading members…')
                      : (language === 'es' ? 'Sin resultados' : 'No results')}
                  </p>
                ) : (
                  filteredMembers.map(member => {
                    const ids: string[] = form.watch('assigneeUserIds') ?? [];
                    const checked = ids.includes(member.userId);
                    return (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={val => {
                            const current: string[] = form.getValues('assigneeUserIds') ?? [];
                            if (val) {
                              form.setValue('assigneeUserIds', [...current, member.userId]);
                            } else {
                              form.setValue('assigneeUserIds', current.filter(id => id !== member.userId));
                            }
                          }}
                        />
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={member.user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{getInitials(`${member.user.firstName} ${member.user.lastName ?? ''}`)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
              {(form.watch('assigneeUserIds') ?? []).length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {(form.watch('assigneeUserIds') ?? []).map(uid => {
                    const m = members.find(mem => mem.userId === uid);
                    if (!m) return null;
                    const mName = `${m.user.firstName} ${m.user.lastName ?? ''}`.trim();
                    return (
                      <Badge key={uid} variant="secondary" className="gap-1 pr-1">
                        {mName}
                        <button
                          type="button"
                          onClick={() => {
                            const current: string[] = form.getValues('assigneeUserIds') ?? [];
                            form.setValue('assigneeUserIds', current.filter(id => id !== uid));
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>}

            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end px-5 py-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={() => setNoteFormOpen(false)} disabled={isSaving}>
                {cl.cancel}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingNote ? cl.saveChanges : cl.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{cl.deleteNote}</AlertDialogTitle>
            <AlertDialogDescription>
              {cl.deleteConfirm}
              <br />
              <strong>{deleteTarget?.title}</strong>
              <br />
              {cl.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cl.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : cl.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
