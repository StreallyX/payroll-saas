import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"

export const bankRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL BANKS
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.banks.view))
    .query(async ({ ctx }) => {
      return ctx.prisma.bank.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET ONE BANK
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.banks.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.bank.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })
    }),

  // -------------------------------------------------------
  // CREATE BANK
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.banks.create))
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

      const bank = await ctx.prisma.bank.create({
        data: {
          ...input,
          tenantId,
        },
      })

      await createAuditLog({
        tenantId,
        userId: ctx.session!.user.id,
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
    .use(hasPermission(PERMISSION_TREE_V2.banks.update))
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

      // Sécurité multi-tenant : vérifier que la banque appartient bien au tenant
      const existing = await ctx.prisma.bank.findFirst({
        where: { id, tenantId },
      })

      if (!existing) {
        throw new Error("Bank not found in tenant")
      }

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
    .use(hasPermission(PERMISSION_TREE_V2.banks.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!

      const bank = await ctx.prisma.bank.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!bank) {
        throw new Error("Bank not found in tenant")
      }

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
