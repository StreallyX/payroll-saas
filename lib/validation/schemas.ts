
/**
 * Common validation schemas
 * Reusable Zod schemas for consistent validation
 */

import { z } from 'zod';

// Common field validations
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const cuidSchema = z.string().cuid('Invalid ID format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const urlSchema = z.string().url('Invalid URL format');

export const dateStringSchema = z.string().datetime('Invalid date format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Common response schema
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    metadata: z
      .object({
        timestamp: z.string(),
        requestId: z.string().optional(),
      })
      .optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        totalItems: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrevious: z.boolean(),
      }),
    }),
    metadata: z
      .object({
        timestamp: z.string(),
        requestId: z.string().optional(),
      })
      .optional(),
  });

// ID parameter schema
export const idParamSchema = z.object({
  id: cuidSchema,
});

// Bulk operation schemas
export const bulkDeleteSchema = z.object({
  ids: z.array(cuidSchema).min(1, 'At least one ID is required'),
});

export const bulkUpdateSchema = <T extends z.ZodType>(updateSchema: T) =>
  z.object({
    ids: z.array(cuidSchema).min(1, 'At least one ID is required'),
    data: updateSchema,
  });

// Filter schemas
export const dateRangeFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const searchFilterSchema = z.object({
  query: z.string().min(1).optional(),
  fields: z.array(z.string()).optional(),
});

// Status schemas
export const statusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'suspended',
  'deleted',
]);

// Multi-tenant schema helpers
export const tenantScopedSchema = <T extends z.ZodType>(schema: T) =>
  schema.extend({
    tenantId: cuidSchema.optional(),
  });
