
/**
 * SMS Log Router
 * Handles SMS log viewing and monitoring
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PERMISSION_TREE } from '../../rbac/permissions';
import { Prisma } from '@prisma/client';

export const smsLogRouter = createTRPCRouter({
  /**
   * List all SMS logs for the tenant with pagination and filters
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

      const where: Prisma.SMSLogWhereInput = {
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
        ctx.prisma.sMSLog.findMany({
          where,
          orderBy: { sentAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.sMSLog.count({ where }),
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
   * Get a single SMS log by ID
   */
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const log = await ctx.prisma.sMSLog.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SMS log not found',
        });
      }

      return { success: true, data: log };
    }),

  /**
   * Get SMS statistics
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
      const where: Prisma.SMSLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (input?.startDate || input?.endDate) {
        where.sentAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [total, sent, failed, pending] = await Promise.all([
        ctx.prisma.sMSLog.count({ where }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: 'SENT' } }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: 'FAILED' } }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: 'PENDING' } }),
      ]);

      // Calculate total cost if available
      const logs = await ctx.prisma.sMSLog.findMany({
        where,
        select: { cost: true },
      });

      const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

      return {
        success: true,
        data: {
          total,
          sent,
          failed,
          pending,
          totalCost,
          successRate: total > 0 ? (sent / total) * 100 : 0,
        },
      };
    }),

  /**
   * Get recent SMS logs
   */
  getRecent: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.sMSLog.findMany({
        where: {
          tenantId: ctx.tenantId!,
        },
        orderBy: { sentAt: 'desc' },
        take: input?.limit ?? 10,
      });

      return { success: true, data: logs };
    }),

  /**
   * Resend a failed SMS
   */
  resend: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.sMSLog.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SMS log not found',
        });
      }

      if (log.status === 'SENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SMS was already sent successfully',
        });
      }

      // Update status to pending for resend
      await ctx.prisma.sMSLog.update({
        where: { id: input.id },
        data: {
          status: 'PENDING',
          error: null,
        },
      });

      // TODO: Trigger SMS sending service here
      // smsService.send(log)

      return { success: true, message: 'SMS queued for resending' };
    }),
});
