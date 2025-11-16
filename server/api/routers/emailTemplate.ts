
/**
 * Email Template Management Router
 * Handles email template CRUD and preview
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PERMISSION_TREE } from '../../rbac/permissions';

export const emailTemplateRouter = createTRPCRouter({
  /**
   * List all email templates for the tenant
   */
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.emailTemplate.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: templates };
    }),

  /**
   * Get a single email template
   */
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email template not found',
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
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: {
          key: input.key,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email template not found',
        });
      }

      return { success: true, data: template };
    }),

  /**
   * Create a new email template
   */
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if template key already exists
      const existing = await ctx.prisma.emailTemplate.findFirst({
        where: {
          key: input.key,
          tenantId: ctx.tenantId!,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email template with this key already exists',
        });
      }

      const template = await ctx.prisma.emailTemplate.create({
        data: {
          ...input,
          tenantId: ctx.tenantId!,
        },
      });

      return { success: true, data: template };
    }),

  /**
   * Update an email template
   */
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const template = await ctx.prisma.emailTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId!,
        },
        data,
      });

      return { success: true, data: template };
    }),

  /**
   * Delete an email template
   */
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.emailTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      return { success: true };
    }),

  /**
   * Preview email template with sample data
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
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email template not found',
        });
      }

      // Replace variables in template
      let subject = template.subject;
      let body = template.body;

      if (input.sampleData) {
        Object.entries(input.sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(value));
          body = body.replace(regex, String(value));
        });
      }

      return {
        success: true,
        data: {
          subject,
          body,
          originalSubject: template.subject,
          originalBody: template.body,
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
      ];

      return { success: true, data: variables };
    }),

  /**
   * Duplicate an email template
   */
  duplicate: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!original) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email template not found',
        });
      }

      // Create a copy with a new key
      const copy = await ctx.prisma.emailTemplate.create({
        data: {
          tenantId: ctx.tenantId!,
          key: `${original.key}_copy_${Date.now()}`,
          name: `${original.name} (Copy)`,
          subject: original.subject,
          body: original.body,
          description: original.description,
          isActive: false,
        },
      });

      return { success: true, data: copy };
    }),
});
