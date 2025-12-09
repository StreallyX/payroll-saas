import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";

// -----------------------------------------------------
// PERMISSIONS V3
// -----------------------------------------------------
const VIEW = buildPermissionKey(Resource.AUDIT_LOG, Action.READ, PermissionScope.GLOBAL);

export const userActivityRouter = createTRPCRouter({

  // -----------------------------------------------------
  // LIST ALL ACTIVITIES
  // -----------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW))
    .input(
      z.object({
        userId: z.string().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.UserActivityWhereInput = { tenantId: ctx.tenantId };

      if (input?.userId) where.userId = input.userId;
      if (input?.action) where.action = input.action;
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.entityId) where.entityId = input.entityId;

      if (input?.startDate || input?.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [activities, total] = await Promise.all([
        ctx.prisma.userActivity.findMany({
          where,
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
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

  // -----------------------------------------------------
  // GET BY ID
  // -----------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.prisma.userActivity.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          user: { select: { name: true, email: true } },
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

  // -----------------------------------------------------
  // GET ACTIVITIES FOR A USER
  // -----------------------------------------------------
  getByUser: tenantProcedure
    .use(hasPermission(VIEW))
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userActivity.findMany({
        where: {
          userId: input.userId,
          tenantId: ctx.tenantId,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // -----------------------------------------------------
  // GET ACTIVITIES FOR A SPECIFIC ENTITY
  // -----------------------------------------------------
  getByEntity: tenantProcedure
    .use(hasPermission(VIEW))
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userActivity.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // -----------------------------------------------------
  // GET RECENT ACTIVITY
  // -----------------------------------------------------
  getRecent: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userActivity.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 20,
      });
    }),

  // -----------------------------------------------------
  // INTERNAL LOG (no permission — logged user only)
  // -----------------------------------------------------
  log: tenantProcedure
    .input(
      z.object({
        action: z.string(),
        entityType: z.string(),
        entityId: z.string().optional(),
        entityName: z.string().optional(),
        description: z.string(),
        metadata: z.record(z.any()).optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userActivity.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
