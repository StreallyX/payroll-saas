

import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const bankRouter = createTRPCRouter({
  /**
   * Get all banks
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.bank.findMany({
      where: { tenantId: ctx.session?.user?.tenantId || "" },
      orderBy: { createdAt: "desc" }
    })
  }),

  /**
   * Get single bank by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.bank.findUnique({
        where: { id: input.id }
      })
    }),

  /**
   * Create a new bank
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Bank name is required"),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId || ""

      const bank = await ctx.prisma.bank.create({
        data: {
          ...input,
          tenantId
        }
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
        tenantId
      })

      return bank
    }),

  /**
   * Update an existing bank
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const tenantId = ctx.session?.user?.tenantId || ""

      const bank = await ctx.prisma.bank.update({
        where: { id },
        data
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
        tenantId
      })

      return bank
    }),

  /**
   * Delete a bank
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId || ""
      
      const bank = await ctx.prisma.bank.findUnique({
        where: { id: input.id }
      })

      await ctx.prisma.bank.delete({
        where: { id: input.id }
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.BANK,
        entityId: input.id,
        entityName: bank?.name || "Unknown",
        tenantId
      })

      return { success: true }
    })
})
