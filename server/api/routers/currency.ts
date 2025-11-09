

import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const currencyRouter = createTRPCRouter({
  /**
   * Get all active currencies (public - no auth needed)
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" }
    })
  }),

  /**
   * Get single currency by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.currency.findUnique({
        where: { id: input.id }
      })
    }),

  /**
   * Create a new currency (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().length(3, "Code must be 3 characters (e.g., USD)"),
        name: z.string().min(1, "Currency name is required"),
        symbol: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currency = await ctx.prisma.currency.create({
        data: input
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CURRENCY,
        entityId: currency.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          code: currency.code,
          symbol: currency.symbol,
        },
        tenantId: ctx.session.user.tenantId,
      })

      return currency
    }),

  /**
   * Update an existing currency (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().length(3).optional(),
        name: z.string().min(1).optional(),
        symbol: z.string().optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const currency = await ctx.prisma.currency.update({
        where: { id },
        data
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CURRENCY,
        entityId: currency.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          updatedFields: data,
        },
        tenantId: ctx.session.user.tenantId,
      })

      return currency
    }),

  /**
   * Delete a currency (admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get currency details before deleting
      const currency = await ctx.prisma.currency.findUnique({
        where: { id: input.id }
      })

      if (!currency) {
        throw new Error("Currency not found")
      }

      await ctx.prisma.currency.delete({
        where: { id: input.id }
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CURRENCY,
        entityId: input.id,
        entityName: `${currency.code} - ${currency.name}`,
        metadata: {
          code: currency.code,
        },
        tenantId: ctx.session.user.tenantId,
      })

      return { success: true }
    })
})
