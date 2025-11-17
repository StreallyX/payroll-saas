import { z } from "zod"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  hasPermission
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"

export const currencyRouter = createTRPCRouter({

  // -------------------------------------------------------
  // PUBLIC — LIST ACTIVE CURRENCIES
  // -------------------------------------------------------
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    })
  }),

  // -------------------------------------------------------
  // PUBLIC — GET BY ID
  // -------------------------------------------------------
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.currency.findUnique({
        where: { id: input.id },
      })
    }),

  // -------------------------------------------------------
  // CREATE CURRENCY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  create: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.superadmin.users.create))
    .input(
      z.object({
        code: z.string().length(3, "Code must be 3 characters (e.g., USD)"),
        name: z.string().min(1, "Currency name is required"),
        symbol: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currency = await ctx.prisma.currency.create({
        data: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CURRENCY,
        entityId: currency.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          code: currency.code,
          symbol: currency.symbol,
        },
        tenantId: ctx.session!.user.tenantId ?? undefined,
      })

      return currency
    }),

  // -------------------------------------------------------
  // UPDATE CURRENCY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  update: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.superadmin.users.update ?? PERMISSION_TREE_V2.superadmin.users.create))
    .input(
      z.object({
        id: z.string(),
        code: z.string().length(3).optional(),
        name: z.string().min(1).optional(),
        symbol: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const currency = await ctx.prisma.currency.update({
        where: { id },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CURRENCY,
        entityId: currency.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          updatedFields: data,
        },
        tenantId: ctx.session!.user.tenantId ?? undefined,
      })

      return currency
    }),

  // -------------------------------------------------------
  // DELETE CURRENCY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  delete: protectedProcedure
    .use(hasPermission(PERMISSION_TREE_V2.superadmin.users.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const currency = await ctx.prisma.currency.findUnique({
        where: { id: input.id },
      })

      if (!currency) {
        throw new Error("Currency not found")
      }

      await ctx.prisma.currency.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CURRENCY,
        entityId: input.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          code: currency.code,
        },
        tenantId: ctx.session!.user.tenantId ?? undefined,
      })

      return { success: true }
    }),
})
