
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const auditLogRouter = createTRPCRouter({
  /**
   * Get all audit logs with filtering and pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.auditLog.findMany({
        where: {
          ...(input.entityType && { entityType: input.entityType }),
          ...(input.entityId && { entityId: input.entityId }),
          ...(input.userId && { userId: input.userId }),
          ...(input.action && { action: input.action }),
          tenantId: ctx.session?.user?.tenantId || undefined
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      let nextCursor: typeof input.cursor | undefined = undefined
      if (logs.length > input.limit) {
        const nextItem = logs.pop()
        nextCursor = nextItem!.id
      }

      return {
        logs,
        nextCursor
      }
    }),

  /**
   * Get audit log statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session?.user?.tenantId

    const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] = await Promise.all([
      ctx.prisma.auditLog.count({
        where: { tenantId }
      }),
      ctx.prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
        where: { tenantId },
        orderBy: {
          _count: {
            action: "desc"
          }
        },
        take: 10
      }),
      ctx.prisma.auditLog.groupBy({
        by: ["entityType"],
        _count: true,
        where: { tenantId },
        orderBy: {
          _count: {
            entityType: "desc"
          }
        },
        take: 10
      }),
      ctx.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ])

    return {
      totalLogs,
      actionBreakdown,
      entityBreakdown,
      recentActivity
    }
  }),

  /**
   * Get audit logs for a specific entity
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.auditLog.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.session?.user?.tenantId || undefined
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    })
})
