import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  taxId: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const siteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const rateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  baseRatePerHour: z.number().min(0).optional().nullable(),
  overtimeRatePerHour: z.number({ invalid_type_error: 'Required' }).min(0),
  currency: z.string().length(3).default('EUR'),
  overtimeTriggers: z.array(z.enum(['WEEKEND', 'AFTER_HOURS', 'MANUAL'])).default([]),
  workdayStartTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .or(z.literal(''))
    .nullable(),
  workdayEndTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .or(z.literal(''))
    .nullable(),
  workdays: z.array(z.number()).default([1, 2, 3, 4, 5]),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().min(1, 'Start date is required'),
  effectiveTo: z.string().optional().or(z.literal('')).nullable(),
});

export const resourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  baseRatePerHour: z.number({ invalid_type_error: 'Required' }).min(0),
  isActive: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type SiteFormData = z.infer<typeof siteSchema>;
export type RateFormData = z.infer<typeof rateSchema>;
export type ResourceFormData = z.infer<typeof resourceSchema>;
