export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    timeEntries: number;
  };
}

export interface TimeEntry {
  id: string;
  userId: string;
  companyId: string;
  projectId?: string | null;
  date: string;
  hours: number;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  description?: string | null;
  // New fields
  isOvertime: boolean;
  appliedRatePerHour?: number | null;
  clientId?: string | null;
  clientSiteId?: string | null;
  categoryId?: string | null;
  loggedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string | null;
  };
  project?: Project | null;
  company?: {
    id: string;
    name: string;
    slug: string;
  };
  client?: { id: string; name: string } | null;
  clientSite?: { id: string; name: string; city?: string | null } | null;
  category?: { id: string; name: string; color?: string | null } | null;
  loggedByUser?: { id: string; fullName: string; avatar?: string | null } | null;
}

export interface CreateTimeEntryDto {
  companyId: string;
  projectId?: string | null;
  date: string | Date;
  hours: number;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  description?: string | null;
  // New fields
  isOvertime?: boolean;
  clientId?: string | null;
  clientSiteId?: string | null;
  categoryId?: string | null;
  targetUserId?: string | null;
}

export interface UpdateTimeEntryDto {
  projectId?: string | null;
  date?: string | Date;
  hours?: number;
  startTime?: string | null;
  endTime?: string | null;
  title?: string;
  description?: string | null;
  // New fields
  isOvertime?: boolean;
  clientId?: string | null;
  clientSiteId?: string | null;
  categoryId?: string | null;
}

export interface ListTimeEntriesQuery {
  page?: number;
  limit?: number;
  companyId?: string;
  projectId?: string;
  userId?: string;
  clientId?: string;
  categoryId?: string;
  isOvertime?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TimeEntrySummary {
  totalHours: number;
  totalEntries: number;
  byProject: {
    projectId?: string | null;
    projectName: string;
    hours: number;
    entries: number;
  }[];
  startDate: string;
  endDate: string;
}

export interface CreateProjectDto {
  companyId: string;
  name: string;
  description?: string | null;
  color?: string;
  isActive?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  color?: string;
  isActive?: boolean;
}

export interface ListProjectsQuery {
  page?: number;
  limit?: number;
  companyId: string;
  isActive?: boolean;
  search?: string;
}

