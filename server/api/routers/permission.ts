import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"

export const permissionRouter = createTRPCRouter({

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: { key: "asc" },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.permission.findUnique({
        where: { id: input.id },
      })
    }),

  getByKeys: protectedProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.permission.findMany({
        where: { key: { in: input.keys } },
      })
    }),

  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session?.user
    if (!user) return []

    return user.permissions || []
  }),

  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      const perms = ctx.session?.user.permissions || []
      return perms.includes(input.permission)
    }),

  hasAnyPermission: protectedProcedure
    .input(z.object({ permissions: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const perms = ctx.session?.user.permissions || []
      return input.permissions.some(p => perms.includes(p))
    }),

  hasAllPermissions: protectedProcedure
    .input(z.object({ permissions: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const perms = ctx.session?.user.permissions || []
      return input.permissions.every(p => perms.includes(p))
    }),

  getGrouped: protectedProcedure.query(async ({ ctx }) => {
    const userPermissions = ctx.session.user.permissions || []
    const hasGlobal = userPermissions.includes("permission.list.global")

    const permissions = await ctx.prisma.permission.findMany({
      orderBy: { key: "asc" },
    })

    const filtered = hasGlobal
      ? permissions
      : permissions.filter(p => userPermissions.includes(p.key))

    const grouped: Record<string, any[]> = {}

    filtered.forEach(permission => {
      const category = permission.key.split(".")[0]
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(permission)
    })

    return Object.entries(grouped).map(([category, perms]) => ({
      category,
      permissions: perms,
    }))
  }),

})
