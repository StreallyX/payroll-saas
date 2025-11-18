import { z } from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
  hasPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const companyRouter = createTRPCRouter({

  // ======================================================
  // GET ALL COMPANIES (GLOBAL)
  // ======================================================
  getAll: protectedProcedure
    .use(hasPermission("companies.read.global"))
    .query(async ({ ctx }) => {
      return ctx.prisma.company.findMany({
        where: { tenantId: ctx.session!.user.tenantId },
        include: { country: true },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ======================================================
  // GET MINE (OWN)
  // ======================================================
  getMine: protectedProcedure
    .use(hasPermission("companies.read.own"))
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id

      return ctx.prisma.company.findMany({
        where: {
          tenantId: ctx.session!.user.tenantId,
          createdBy: userId,
        },
        include: { country: true },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ======================================================
  // GET ONE (GLOBAL or OWN)
  // ======================================================
  getById: protectedProcedure
    .use(hasPermission("companies.read.global"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id },
        include: { country: true },
      })

      if (!company) return null

      const canSeeGlobal = ctx.session!.user.hasPermission("companies.read.global")

      // OWN-SCOPE restriction → forbidden if not creator
      if (!canSeeGlobal && company.createdBy !== userId) {
        throw new Error("You do not have access to this company")
      }

      return company
    }),

  // ======================================================
  // CREATE COMPANY
  // ======================================================
  create: protectedProcedure
    .use(hasPermission("companies.create.global"))
    .input(
      z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().email().optional().or(z.literal("")),
        alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),
        vatNumber: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId
      const userId = ctx.session!.user.id

      const company = await ctx.prisma.company.create({
        data: {
          ...input,
          tenantId,
          createdBy: userId, // ⬅ ESSENTIEL POUR OWN-SCOPE
        },
      })

      await createAuditLog({
        userId,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COMPANY,
        entityId: company.id,
        entityName: company.name,
        tenantId,
      })

      return company
    }),

  // ======================================================
  // UPDATE COMPANY
  // ======================================================
  update: protectedProcedure
    .use(hasPermission("companies.update.global"))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().email().optional().or(z.literal("")),
        alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),
        vatNumber: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const tenantId = ctx.session!.user.tenantId

      const company = await ctx.prisma.company.update({
        where: { id },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COMPANY,
        entityId: company.id,
        entityName: company.name,
        tenantId,
      })

      return company
    }),

  // ======================================================
  // DELETE COMPANY
  // ======================================================
  delete: protectedProcedure
    .use(hasPermission("companies.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId

      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id },
      })

      await ctx.prisma.company.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.COMPANY,
        entityId: input.id,
        entityName: company?.name ?? "Unknown",
        tenantId,
      })

      return { success: true }
    }),

  // ======================================================
  // STATS
  // ======================================================
  getStats: protectedProcedure
    .use(hasPermission("companies.read.global"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session!.user.tenantId

      const [total, active, inactive] = await Promise.all([
        ctx.prisma.company.count({ where: { tenantId } }),
        ctx.prisma.company.count({
          where: { tenantId, status: "active" },
        }),
        ctx.prisma.company.count({
          where: { tenantId, status: "inactive" },
        }),
      ])

      return { total, active, inactive }
    }),
})
