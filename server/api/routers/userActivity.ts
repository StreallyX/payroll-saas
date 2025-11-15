
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

/**
 * User Activity Router - Phase 2
 * 
 * Handles user activity tracking and audit logs
 */

export const userActivityRouter = createTRPCRouter({
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.UserActivityWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.userId) where.userId = input.userId;
      if (input?.action) where.action = input.action;
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.entityId) where.entityId = input.entityId;

      if (input?.startDate || input?.endDate) {
        where.occurredAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [activities, total] = await Promise.all([
        ctx.prisma.userActivity.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { occurredAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.userActivity.count({ where }),
      ]);

      return {
        activities,
        total,
        hasMore: (input?.offset ?? 0) + activities.length < total,
      };
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.prisma.userActivity.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      return activity;
    }),

  getByUser: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          userId: input.userId,
          tenantId: ctx.tenantId,
        },
        orderBy: { occurredAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return activities;
    }),

  getByEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { occurredAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return activities;
    }),

  getRecent: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.audit.view))
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          tenantId: ctx.tenantId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { occurredAt: "desc" },
        take: input?.limit ?? 20,
      });

      return activities;
    }),

  log: tenantProcedure
    .input(z.object({
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional(),
      entityName: z.string().optional(),
      description: z.string(),
      metadata: z.record(z.any()).optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.prisma.userActivity.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          userId: ctx.session.user.id,
        },
      });

      return activity;
    }),
});
