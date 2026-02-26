export type OvertimeTrigger = 'WEEKEND' | 'AFTER_HOURS' | 'MANUAL';

export interface ClientSite {
  id: string;
  clientId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRateRuleResource {
  id: string;
  rateRuleId: string;
  name: string;
  baseRatePerHour: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRateRule {
  id: string;
  clientId: string;
  name: string;
  baseRatePerHour?: number | null;
  overtimeRatePerHour: number;
  resources: ClientRateRuleResource[];
  currency: string;
  overtimeTriggers: OvertimeTrigger[];
  workdayStartTime?: string | null;
  workdayEndTime?: string | null;
  workdays: number[];
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  isDefault: boolean;
  sites: ClientSite[];
  rateRules: ClientRateRule[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    timeEntries: number;
  };
}

export interface TimeEntryCategory {
  id: string;
  companyId: string;
  name: string;
  color?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateClientDto {
  companyId: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateClientSiteDto {
  name: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateClientSiteDto {
  name?: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateClientRateRuleResourceDto {
  name: string;
  baseRatePerHour: number;
  isActive?: boolean;
}

export interface UpdateClientRateRuleResourceDto {
  name?: string;
  baseRatePerHour?: number;
  isActive?: boolean;
}

export interface CreateClientRateRuleDto {
  name: string;
  baseRatePerHour?: number | null;
  overtimeRatePerHour: number;
  currency?: string;
  overtimeTriggers?: OvertimeTrigger[];
  workdayStartTime?: string | null;
  workdayEndTime?: string | null;
  workdays?: number[];
  isActive?: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UpdateClientRateRuleDto extends Partial<CreateClientRateRuleDto> {}

export interface CreateCategoryDto {
  companyId: string;
  name: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
