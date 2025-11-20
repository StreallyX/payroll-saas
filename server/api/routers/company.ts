import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

// ------------------------------------------------------
// PERMISSIONS (matching your new RBAC V3 database)
// ------------------------------------------------------
const CAN_READ_ALL = "companies.read.global"
const CAN_READ_OWN = "companies.read.own"
const CAN_CREATE = "companies.create.global"
const CAN_UPDATE = "companies.update.global"
const CAN_DELETE = "companies.delete.global"

export const companyRouter = createTRPCRouter({

  // ======================================================
  // GET ALL (GLOBAL SCOPE)
  // ======================================================
  getAll: tenantProcedure
    .use(hasPermission(CAN_READ_ALL))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!

      return ctx.prisma.company.findMany({
        where: { tenantId },
        include: {
          country: true,
          companyUsers: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ======================================================
  // GET MINE (OWN SCOPE) — via CompanyUser table
  // ======================================================
  getMine: tenantProcedure
    .use(hasPermission(CAN_READ_OWN))
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id
      const tenantId = ctx.tenantId!

      const memberships = await ctx.prisma.companyUser.findMany({
        where: {
          userId,
          company: { tenantId },
        },
        include: {
          company: {
            include: { country: true },
          },
        },
      })

      return memberships.map((cu) => cu.company)
    }),

  // ======================================================
  // GET BY ID (GLOBAL or OWN)
  // ======================================================
  getById: tenantProcedure
    .use(hasAnyPermission([CAN_READ_ALL, CAN_READ_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.id, tenantId },
        include: {
          country: true,
          companyUsers: {
            include: { user: true },
          },
        },
      })

      if (!company) return null

      // If user has global, no need to check further
      const canSeeGlobal = ctx.session!.user.hasPermission?.(CAN_READ_ALL)
      if (canSeeGlobal) return company

      // OWN scope → user must be part of the CompanyUser table
      const membership = await ctx.prisma.companyUser.findFirst({
        where: { companyId: input.id, userId },
      })

      if (!membership) {
        throw new Error("You do not have access to this company")
      }

      return company
    }),

  // ======================================================
  // CREATE COMPANY
  // ======================================================
  create: tenantProcedure
    .use(hasPermission(CAN_CREATE))
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
      const tenantId = ctx.tenantId!
      const userId = ctx.session!.user.id

      // 1) Create company
      const company = await ctx.prisma.company.create({
        data: {
          ...input,
          tenantId,
          createdBy: userId,
        },
      })

      // 2) Register user as OWNER in CompanyUser
      await ctx.prisma.companyUser.create({
        data: {
          userId,
          companyId: company.id,
          role: "owner",
        },
      })

      // 3) Audit log
      await createAuditLog({
        userId,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        entityId: company.id,
        entityName: company.name,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COMPANY,
        tenantId,
      })

      return company
    }),

  // ======================================================
  // UPDATE COMPANY
  // ======================================================
  update: tenantProcedure
    .use(hasPermission(CAN_UPDATE))
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
      const tenantId = ctx.tenantId!
      const { id, ...data } = input

      const updated = await ctx.prisma.company.update({
        where: { id },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COMPANY,
        entityId: updated.id,
        entityName: updated.name,
        tenantId,
      })

      return updated
    }),

  // ======================================================
  // DELETE COMPANY
  // ======================================================
  delete: tenantProcedure
    .use(hasPermission(CAN_DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!

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
  getStats: tenantProcedure
    .use(hasPermission(CAN_READ_ALL))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!

      const [total, active, inactive] = await Promise.all([
        ctx.prisma.company.count({ where: { tenantId } }),
        ctx.prisma.company.count({ where: { tenantId, status: "active" } }),
        ctx.prisma.company.count({ where: { tenantId, status: "inactive" } }),
      ])

      return { total, active, inactive }
    }),
})
