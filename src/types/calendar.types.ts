export interface CalendarNoteUser {
  id: string;
  fullName: string;
  email: string;
  avatar?: string | null;
}

export interface CalendarNoteAssignee {
  id: string;
  calendarNoteId: string;
  userId: string;
  user: CalendarNoteUser;
}

export interface CalendarNote {
  id: string;
  companyId: string;
  date: string; // ISO date string "YYYY-MM-DD"
  title: string;
  content?: string | null;
  color?: string | null;
  isPrivate: boolean;
  createdByUserId: string;
  createdBy: CalendarNoteUser;
  assignees: CalendarNoteAssignee[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarNoteDto {
  companyId: string;
  date: string | Date;
  title: string;
  content?: string | null;
  color?: string | null;
  isPrivate?: boolean;
  assigneeUserIds?: string[];
}

export interface UpdateCalendarNoteDto {
  date?: string | Date;
  title?: string;
  content?: string | null;
  color?: string | null;
  isPrivate?: boolean;
  assigneeUserIds?: string[];
}

export interface ListCalendarNotesQuery {
  companyId: string;
  startDate: string;
  endDate: string;
}
