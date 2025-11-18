import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const bankRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL BANKS — GLOBAL
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission("banks.read.global"))
    .query(async ({ ctx }) => {
      return ctx.prisma.bank.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET BANKS CREATED BY CURRENT USER — OWN
  // -------------------------------------------------------
  getMine: tenantProcedure
    .use(hasPermission("banks.read.own"))
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id

      return ctx.prisma.bank.findMany({
        where: {
          tenantId: ctx.tenantId,
          createdBy: userId,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET ONE BANK (GLOBAL or OWN)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission("banks.read.global"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const bank = await ctx.prisma.bank.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!bank) return null

      // Own-scope → Interdit de voir si pas créateur
      const canSeeGlobal = ctx.session!.user.hasPermission("banks.read.global")

      if (!canSeeGlobal && bank.createdBy !== userId) {
        throw new Error("You do not have access to this bank")
      }

      return bank
    }),

  // -------------------------------------------------------
  // CREATE BANK
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission("banks.create.global"))
    .input(
      z.object({
        name: z.string().min(1, "Bank name is required"),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {

      const tenantId = ctx.tenantId!
      const userId = ctx.session!.user.id

      const bank = await ctx.prisma.bank.create({
        data: {
          ...input,
          tenantId,
          createdBy: userId,
        },
      })

      await createAuditLog({
        tenantId,
        userId,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
        description: `Created bank ${bank.name}`,
      })

      return bank
    }),

  // -------------------------------------------------------
  // UPDATE BANK
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission("banks.update.global"))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      const { id, ...data } = input
      const tenantId = ctx.tenantId!

      const existing = await ctx.prisma.bank.findFirst({
        where: { id, tenantId },
      })

      if (!existing) throw new Error("Bank not found in tenant")

      const bank = await ctx.prisma.bank.update({
        where: { id },
        data,
      })

      await createAuditLog({
        tenantId,
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
        description: `Updated bank ${bank.name}`,
      })

      return bank
    }),

  // -------------------------------------------------------
  // DELETE BANK
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission("banks.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const tenantId = ctx.tenantId!

      const bank = await ctx.prisma.bank.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!bank) throw new Error("Bank not found in tenant")

      await ctx.prisma.bank.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        tenantId,
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
        description: `Deleted bank ${bank.name}`,
      })

      return { success: true }
    }),
})
