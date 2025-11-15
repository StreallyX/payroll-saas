
/**
 * Permission Audit Router
 * Tracks and logs permission changes for compliance and security
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const permissionAuditRouter = createTRPCRouter({
  /**
   * List permission audit logs
   */
  list: tenantProcedure
    .use(hasPermission('audit_logs.view'))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        userId: z.string().optional(),
        action: z.enum(['GRANT', 'REVOKE', 'ROLE_ASSIGNED', 'ROLE_REMOVED']).optional(),
        resourceType: z.enum(['ROLE', 'PERMISSION', 'USER']).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        userId,
        action,
        resourceType,
        startDate,
        endDate,
      } = input;

      const where: any = {
        tenantId: ctx.tenantId!,
      };

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (resourceType) where.resourceType = resourceType;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [items, totalItems] = await Promise.all([
        ctx.prisma.permissionAudit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.permissionAudit.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        },
      };
    }),

  /**
   * Get audit details by ID
   */
  getById: tenantProcedure
    .use(hasPermission('audit_logs.view'))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const audit = await ctx.prisma.permissionAudit.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!audit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Audit log not found',
        });
      }

      return { success: true, data: audit };
    }),

  /**
   * Get audit history for a specific user
   */
  getUserHistory: tenantProcedure
    .use(hasPermission('audit_logs.view'))
    .input(
      z.object({
        userId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, page, pageSize } = input;

      const where = {
        tenantId: ctx.tenantId!,
        userId,
      };

      const [items, totalItems] = await Promise.all([
        ctx.prisma.permissionAudit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.permissionAudit.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        },
      };
    }),

  /**
   * Get audit history for a specific role
   */
  getRoleHistory: tenantProcedure
    .use(hasPermission('audit_logs.view'))
    .input(
      z.object({
        roleId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { roleId, page, pageSize } = input;

      const where = {
        tenantId: ctx.tenantId!,
        resourceType: 'ROLE',
        resourceId: roleId,
      };

      const [items, totalItems] = await Promise.all([
        ctx.prisma.permissionAudit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.permissionAudit.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        },
      };
    }),

  /**
   * Get statistics for permission changes
   */
  getStatistics: tenantProcedure
    .use(hasPermission('audit_logs.view'))
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const where: any = {
        tenantId: ctx.tenantId!,
      };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Get counts by action
      const actionCounts = await ctx.prisma.permissionAudit.groupBy({
        by: ['action'],
        where,
        _count: true,
      });

      // Get counts by resource type
      const resourceCounts = await ctx.prisma.permissionAudit.groupBy({
        by: ['resourceType'],
        where,
        _count: true,
      });

      // Get total count
      const totalCount = await ctx.prisma.permissionAudit.count({ where });

      // Get recent changes
      const recentChanges = await ctx.prisma.permissionAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        success: true,
        data: {
          totalChanges: totalCount,
          byAction: actionCounts.map((item) => ({
            action: item.action,
            count: item._count,
          })),
          byResourceType: resourceCounts.map((item) => ({
            resourceType: item.resourceType,
            count: item._count,
          })),
          recentChanges,
        },
      };
    }),
});

/**
 * Helper function to log permission changes
 */
export async function logPermissionChange(
  prisma: any,
  data: {
    tenantId: string | null;
    userId?: string;
    action: 'GRANT' | 'REVOKE' | 'ROLE_ASSIGNED' | 'ROLE_REMOVED';
    resourceType: 'ROLE' | 'PERMISSION' | 'USER';
    resourceId: string;
    changes: any;
    performedBy: string;
  }
) {
  return prisma.permissionAudit.create({
    data: {
      tenantId: data.tenantId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changes: data.changes,
      performedBy: data.performedBy,
    },
  });
}
