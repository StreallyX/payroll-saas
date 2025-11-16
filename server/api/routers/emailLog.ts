
/**
 * Email Log Router
 * Handles email log viewing and monitoring
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PERMISSION_TREE } from '../../rbac/permissions';
import { Prisma } from '@prisma/client';

export const emailLogRouter = createTRPCRouter({
  /**
   * List all email logs for the tenant with pagination and filters
   */
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(
      z.object({
        recipient: z.string().optional(),
        status: z.enum(['SENT', 'FAILED', 'PENDING', 'QUEUED']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { recipient, status, startDate, endDate, page, pageSize } = input;

      const where: Prisma.EmailLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (recipient) {
        where.recipient = {
          contains: recipient,
          mode: 'insensitive',
        };
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.sentAt = {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        };
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.emailLog.findMany({
          where,
          orderBy: { sentAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.emailLog.count({ where }),
      ]);

      return {
        success: true,
        data: {
          items: logs,
          pagination: {
            page,
            pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
            hasNext: page < Math.ceil(total / pageSize),
            hasPrevious: page > 1,
          },
        },
      };
    }),

  /**
   * Get a single email log by ID
   */
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const log = await ctx.prisma.emailLog.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email log not found',
        });
      }

      return { success: true, data: log };
    }),

  /**
   * Get email statistics
   */
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.EmailLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (input?.startDate || input?.endDate) {
        where.sentAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [total, sent, failed, pending] = await Promise.all([
        ctx.prisma.emailLog.count({ where }),
        ctx.prisma.emailLog.count({ where: { ...where, status: 'SENT' } }),
        ctx.prisma.emailLog.count({ where: { ...where, status: 'FAILED' } }),
        ctx.prisma.emailLog.count({ where: { ...where, status: 'PENDING' } }),
      ]);

      return {
        success: true,
        data: {
          total,
          sent,
          failed,
          pending,
          successRate: total > 0 ? (sent / total) * 100 : 0,
        },
      };
    }),

  /**
   * Get recent email logs
   */
  getRecent: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.emailLog.findMany({
        where: {
          tenantId: ctx.tenantId!,
        },
        orderBy: { sentAt: 'desc' },
        take: input?.limit ?? 10,
      });

      return { success: true, data: logs };
    }),

  /**
   * Resend a failed email
   */
  resend: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.emailLog.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email log not found',
        });
      }

      if (log.status === 'SENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email was already sent successfully',
        });
      }

      // Update status to pending for resend
      await ctx.prisma.emailLog.update({
        where: { id: input.id },
        data: {
          status: 'PENDING',
          error: null,
        },
      });

      // TODO: Trigger email sending service here
      // emailService.send(log)

      return { success: true, message: 'Email queued for resending' };
    }),
});
