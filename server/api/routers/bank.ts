import { z } from "zod"
import { TRPCError } from "@trpc/server"

import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { getUserCompany } from "@/server/helpers/company"

const P = {
  LIST_GLOBAL: "bank.list.global",
  LIST_OWN: "bank.list.own",

  CREATE_GLOBAL: "bank.create.global",
  CREATE_OWN: "bank.create.own",

  UPDATE_GLOBAL: "bank.update.global",
  UPDATE_OWN: "bank.update.own",

  DELETE_GLOBAL: "bank.delete.global",
  DELETE_OWN: "bank.delete.own",
}

export const bankRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL BANKS — GLOBAL or OWN
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!
      const user = ctx.session.user

      const canGlobal = user.permissions.includes(P.LIST_GLOBAL)

      if (canGlobal) {
        return ctx.prisma.bank.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
        })
      }

      // Own scope: only banks created by the user
      return ctx.prisma.bank.findMany({
        where: {
          tenantId,
          createdBy: user.id,
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // -------------------------------------------------------
  // GET ONE BANK — GLOBAL or OWN
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!
      const user = ctx.session.user

      const bank = await ctx.prisma.bank.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!bank) return null

      const canGlobal = user.permissions.includes(P.LIST_GLOBAL)
      const canOwn = user.permissions.includes(P.LIST_OWN)

      if (canGlobal) return bank

      if (canOwn && bank.createdBy === user.id) return bank

      throw new TRPCError({ code: "UNAUTHORIZED" })
    }),


  // -------------------------------------------------------
  // CREATE BANK — GLOBAL or OWN
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
    .input(
      z.object({
        name: z.string().min(1),
        accountNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!
      const user = ctx.session.user

      const bank = await ctx.prisma.bank.create({
        data: {
          ...input,
          tenantId,
          createdBy: user.id,
        },
      })

      await createAuditLog({
        tenantId,
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
      })

      return bank
    }),


  // -------------------------------------------------------
  // UPDATE BANK — GLOBAL or OWN
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
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
      const tenantId = ctx.tenantId!
      const user = ctx.session.user
      const { id, ...data } = input

      const existing = await ctx.prisma.bank.findFirst({
        where: { id, tenantId },
      })

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const canGlobal = user.permissions.includes(P.UPDATE_GLOBAL)
      const canOwn = user.permissions.includes(P.UPDATE_OWN)

      if (!canGlobal && !(canOwn && existing.createdBy === user.id)) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      const bank = await ctx.prisma.bank.update({
        where: { id },
        data,
      })

      await createAuditLog({
        tenantId,
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.BANK,
        entityId: bank.id,
        entityName: bank.name,
      })

      return bank
    }),


  // -------------------------------------------------------
  // DELETE BANK — GLOBAL or OWN
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasAnyPermission([P.DELETE_GLOBAL, P.DELETE_OWN]))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!
      const user = ctx.session.user

      const existing = await ctx.prisma.bank.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const canGlobal = user.permissions.includes(P.DELETE_GLOBAL)
      const canOwn = user.permissions.includes(P.DELETE_OWN)

      if (!canGlobal && !(canOwn && existing.createdBy === user.id)) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      await ctx.prisma.bank.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        tenantId,
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.BANK,
        entityId: input.id,
        entityName: existing.name,
      })

      return { success: true }
    }),

    // -------------------------------------------------------
    // GET BANKS CREATED BY CURRENT USER — OWN ONLY
    // -------------------------------------------------------
    getMine: tenantProcedure
      .use(hasPermission(P.LIST_OWN))
      .query(async ({ ctx }) => {
        const tenantId = ctx.tenantId!
        const userId = ctx.session.user.id

        return ctx.prisma.bank.findMany({
          where: {
            tenantId,
            createdBy: userId,
          },
          orderBy: { createdAt: "desc" },
        })
      }),


    // ============================================================
    // 🔥 NEW: GET MY COMPANY'S BANK ACCOUNT (For Agency Admin)
    // ============================================================
    getMyCompanyBank: tenantProcedure
      .use(hasPermission(P.LIST_OWN))
      .query(async ({ ctx }) => {
        const user = ctx.session.user

        // Récupérer la company du user
        const company = await getUserCompany(user.id)
        if (!company || !company.bankId) {
          return null
        }

        // Récupérer le bank account de la company
        return ctx.prisma.bank.findUnique({
          where: { id: company.bankId },
        })
      }),


    // ============================================================
    // 🔥 NEW: CREATE/UPDATE MY COMPANY'S BANK ACCOUNT (For Agency Admin)
    // ============================================================
    setMyCompanyBank: tenantProcedure
      .use(hasPermission(P.CREATE_OWN))
      .input(
        z.object({
          name: z.string().min(1),
          accountNumber: z.string().optional(),
          swiftCode: z.string().optional(),
          iban: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.tenantId!
        const user = ctx.session.user

        // Récupérer la company du user
        const company = await getUserCompany(user.id)
        if (!company) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "You don't have a company. Create a company first.",
          })
        }

        let bank: any

        // Si la company a déjà un bank, le mettre à jour
        if (company.bankId) {
          bank = await ctx.prisma.bank.update({
            where: { id: company.bankId },
            data: input,
          })

          await createAuditLog({
            tenantId,
            userId: user.id,
            userName: user.name ?? "Unknown",
            userRole: user.roleName,
            action: AuditAction.UPDATE,
            entityType: AuditEntityType.BANK,
            entityId: bank.id,
            entityName: bank.name,
          })
        } else {
          // Créer un nouveau bank et le lier à la company
          bank = await ctx.prisma.bank.create({
            data: {
              ...input,
              tenantId,
              createdBy: user.id,
              status: "active",
            },
          })

          // Lier le bank à la company
          await ctx.prisma.company.update({
            where: { id: company.id },
            data: { bankId: bank.id },
          })

          await createAuditLog({
            tenantId,
            userId: user.id,
            userName: user.name ?? "Unknown",
            userRole: user.roleName,
            action: AuditAction.CREATE,
            entityType: AuditEntityType.BANK,
            entityId: bank.id,
            entityName: bank.name,
          })
        }

        return bank
      }),

})
