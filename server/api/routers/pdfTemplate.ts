
/**
 * PDF Template Management Router
 * Handles PDF template CRUD and generation
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PERMISSION_TREE } from '../../rbac/permissions';

export const pdfTemplateRouter = createTRPCRouter({
  /**
   * List all PDF templates for the tenant
   */
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.pDFTemplate.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: templates };
    }),

  /**
   * Get a single PDF template
   */
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.pDFTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'PDF template not found',
        });
      }

      return { success: true, data: template };
    }),

  /**
   * Get template by key
   */
  getByKey: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.pDFTemplate.findFirst({
        where: {
          key: input.key,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'PDF template not found',
        });
      }

      return { success: true, data: template };
    }),

  /**
   * Create a new PDF template
   */
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        htmlTemplate: z.string().min(1),
        cssTemplate: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        pageSize: z.enum(['A4', 'LETTER', 'LEGAL']).default('A4'),
        orientation: z.enum(['portrait', 'landscape']).default('portrait'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if template key already exists
      const existing = await ctx.prisma.pDFTemplate.findFirst({
        where: {
          key: input.key,
          tenantId: ctx.tenantId!,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'PDF template with this key already exists',
        });
      }

      const template = await ctx.prisma.pDFTemplate.create({
        data: {
          ...input,
          tenantId: ctx.tenantId!,
        },
      });

      return { success: true, data: template };
    }),

  /**
   * Update a PDF template
   */
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        htmlTemplate: z.string().optional(),
        cssTemplate: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        pageSize: z.enum(['A4', 'LETTER', 'LEGAL']).optional(),
        orientation: z.enum(['portrait', 'landscape']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const template = await ctx.prisma.pDFTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId!,
        },
        data,
      });

      return { success: true, data: template };
    }),

  /**
   * Delete a PDF template
   */
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pDFTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      return { success: true };
    }),

  /**
   * Preview PDF template with sample data
   */
  preview: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .input(
      z.object({
        id: z.string(),
        sampleData: z.record(z.any()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.pDFTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'PDF template not found',
        });
      }

      // Replace variables in template
      let html = template.htmlTemplate;
      let css = template.cssTemplate || '';

      if (input.sampleData) {
        Object.entries(input.sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, String(value));
          css = css.replace(regex, String(value));
        });
      }

      return {
        success: true,
        data: {
          html,
          css,
          originalHtml: template.htmlTemplate,
          originalCss: template.cssTemplate,
          pageSize: template.pageSize,
          orientation: template.orientation,
        },
      };
    }),

  /**
   * Get available template variables
   */
  getVariables: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .query(() => {
      const variables = [
        { key: 'name', description: 'User name', example: 'John Doe' },
        { key: 'email', description: 'User email', example: 'john@example.com' },
        { key: 'company', description: 'Company name', example: 'Acme Inc.' },
        { key: 'date', description: 'Current date', example: new Date().toLocaleDateString() },
        { key: 'contractId', description: 'Contract ID', example: 'CNT-001' },
        { key: 'invoiceId', description: 'Invoice ID', example: 'INV-001' },
        { key: 'amount', description: 'Amount', example: '$1,000.00' },
        { key: 'status', description: 'Status', example: 'Active' },
        { key: 'items', description: 'List of items', example: '[{"name": "Item 1", "price": 100}]' },
      ];

      return { success: true, data: variables };
    }),

  /**
   * Duplicate a PDF template
   */
  duplicate: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.pDFTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!original) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'PDF template not found',
        });
      }

      // Create a copy with a new key
      const copy = await ctx.prisma.pDFTemplate.create({
        data: {
          tenantId: ctx.tenantId!,
          key: `${original.key}_copy_${Date.now()}`,
          name: `${original.name} (Copy)`,
          htmlTemplate: original.htmlTemplate,
          cssTemplate: original.cssTemplate,
          description: original.description,
          isActive: false,
          pageSize: original.pageSize,
          orientation: original.orientation,
        },
      });

      return { success: true, data: copy };
    }),
});
