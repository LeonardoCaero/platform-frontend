import { z } from 'zod';
import { CompanyStatus } from '@/types/company.types';

// Base schema for shared fields
const companyBaseSchema = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logo: z.string().max(2048).optional().or(z.literal('')),
  description: z.string().max(5000, 'Description is too long').optional(),
};

export const createCompanySchema = z.object(companyBaseSchema);

export const updateCompanySchema = z.object({
  ...companyBaseSchema,
  status: z.nativeEnum(CompanyStatus),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
