import { z } from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
  hasPermission
} from "../trpc"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"

export const auditLogRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL LOGS (FILTER + PAGINATION)
  // -------------------------------------------------------
  getAll: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.audit.view))
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {

      const tenantFilter = { tenantId: ctx.session!.user.tenantId }

      const logs = await ctx.prisma.auditLog.findMany({
        where: {
          ...tenantFilter,
          ...(input.entityType && { entityType: input.entityType }),
          ...(input.entityId && { entityId: input.entityId }),
          ...(input.userId && { userId: input.userId }),
          ...(input.action && { action: input.action }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: { select: { name: true } },
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (logs.length > input.limit) {
        const nextItem = logs.pop()!
        nextCursor = nextItem.id
      }

      return { logs, nextCursor }
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.audit.view))
    .query(async ({ ctx }) => {

      const tenantFilter = { tenantId: ctx.session!.user.tenantId }

      const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] =
        await Promise.all([
          ctx.prisma.auditLog.count({ where: tenantFilter }),

          ctx.prisma.auditLog.groupBy({
            by: ["action"],
            _count: true,
            where: tenantFilter,
            orderBy: { _count: { action: "desc" } },
            take: 10,
          }),

          ctx.prisma.auditLog.groupBy({
            by: ["entityType"],
            _count: true,
            where: tenantFilter,
            orderBy: { _count: { entityType: "desc" } },
            take: 10,
          }),

          ctx.prisma.auditLog.findMany({
            where: tenantFilter,
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              user: { select: { name: true, email: true } },
            },
          }),
        ])

      return {
        totalLogs,
        actionBreakdown,
        entityBreakdown,
        recentActivity,
      }
    }),

  // -------------------------------------------------------
  // GET LOGS FOR SPECIFIC ENTITY
  // -------------------------------------------------------
  getByEntity: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.audit.view))
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {

      const tenantFilter = { tenantId: ctx.session!.user.tenantId }

      return ctx.prisma.auditLog.findMany({
        where: {
          ...tenantFilter,
          entityType: input.entityType,
          entityId: input.entityId,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: { select: { name: true, email: true } },
        },
      })
    }),
})
