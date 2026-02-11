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
  // GET MY BANK ACCOUNTS — User's own bank accounts
  // -------------------------------------------------------
  getMyBankAccounts: tenantProcedure
    .use(hasPermission(P.LIST_OWN))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!
      const userId = ctx.session.user.id

      return ctx.prisma.bank.findMany({
        where: {
          tenantId,
          userId, // User's own bank accounts
        },
        orderBy: [
          { isPrimary: "desc" }, // Primary accounts first
          { createdAt: "desc" },
        ],
      })
    }),

  // -------------------------------------------------------
  // CREATE BANK — GLOBAL or OWN
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
    .input(
      z.object({
        // Account identification
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountHolder: z.string().optional(),
        
        // Bank information
        bankName: z.string().optional(),
        swiftCode: z.string().optional(),
        intermediarySwiftCode: z.string().optional(),
        routingNumber: z.string().optional(),
        sortCode: z.string().optional(),
        branchCode: z.string().optional(),
        iban: z.string().optional(),
        
        // Bank address
        bankAddress: z.string().optional(),
        bankCity: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        
        // Account details
        currency: z.string().optional(),
        usage: z.enum(["salary", "gross", "expenses", "other"]).optional(),
        
        // Legacy fields (deprecated)
        name: z.string().optional(),
        address: z.string().optional(),
        
        // Flags
        isPrimary: z.boolean().default(false),
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
          userId: user.id, // Associate with user
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
        entityName: bank.accountName || bank.bankName || bank.name || "Bank Account",
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
        
        // Account identification
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountHolder: z.string().optional(),
        
        // Bank information
        bankName: z.string().optional(),
        swiftCode: z.string().optional(),
        intermediarySwiftCode: z.string().optional(),
        routingNumber: z.string().optional(),
        sortCode: z.string().optional(),
        branchCode: z.string().optional(),
        iban: z.string().optional(),
        
        // Bank address
        bankAddress: z.string().optional(),
        bankCity: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        
        // Account details
        currency: z.string().optional(),
        usage: z.enum(["salary", "gross", "expenses", "other"]).optional(),
        
        // Legacy fields (deprecated)
        name: z.string().optional(),
        address: z.string().optional(),
        
        // Flags
        isPrimary: z.boolean().optional(),
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

      if (!canGlobal && !(canOwn && (existing.userId === user.id || existing.createdBy === user.id))) {
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
        entityName: bank.accountName || bank.bankName || bank.name || "Bank Account",
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

      if (!canGlobal && !(canOwn && (existing.userId === user.id || existing.createdBy === user.id))) {
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
        entityName: existing.accountName || existing.bankName || existing.name || "Bank Account",
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

    // -------------------------------------------------------
    // GET BANKS FOR A SPECIFIC USER — GLOBAL ONLY
    // -------------------------------------------------------
    getByUserId: tenantProcedure
      .use(hasPermission(P.LIST_GLOBAL))
      .input(z.object({ userId: z.string() }))
      .query(async ({ ctx, input }) => {
        const tenantId = ctx.tenantId!

        return ctx.prisma.bank.findMany({
          where: {
            tenantId,
            userId: input.userId,
          },
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "desc" },
          ],
        })
      }),

    // -------------------------------------------------------
    // CREATE BANK FOR A SPECIFIC USER — GLOBAL ONLY
    // -------------------------------------------------------
    createForUser: tenantProcedure
      .use(hasPermission(P.CREATE_GLOBAL))
      .input(
        z.object({
          userId: z.string(),

          // Account identification
          accountName: z.string().optional(),
          accountNumber: z.string().optional(),
          accountHolder: z.string().optional(),

          // Bank information
          bankName: z.string().min(1, "Bank name is required"),
          swiftCode: z.string().optional(),
          intermediarySwiftCode: z.string().optional(),
          routingNumber: z.string().optional(),
          sortCode: z.string().optional(),
          branchCode: z.string().optional(),
          iban: z.string().optional(),

          // Bank address
          bankAddress: z.string().optional(),
          bankCity: z.string().optional(),
          country: z.string().optional(),
          state: z.string().optional(),
          postCode: z.string().optional(),

          // Account details
          currency: z.string().optional(),

          // Flags
          isPrimary: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = ctx.tenantId!
        const user = ctx.session.user
        const { userId, ...data } = input

        const bank = await ctx.prisma.bank.create({
          data: {
            ...data,
            tenantId,
            createdBy: user.id,
            userId, // Associate with specified user
            status: "active",
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
          entityName: bank.bankName || bank.accountName || "Bank Account",
          metadata: { forUserId: userId },
        })

        return bank
      }),

})