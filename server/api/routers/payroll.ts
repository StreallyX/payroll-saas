import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"


export const payrollRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL PAYROLL PARTNERS (tenant)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.payrollPartner.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          contracts: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
          _count: { select: { contracts: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // -------------------------------------------------------
  // GET BY ID (tenant)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payrollPartner.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contracts: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
              invoices: true,
            },
          },
        },
      })
    }),


  // -------------------------------------------------------
  // CREATE PAYROLL PARTNER (tenant)
  // -------------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        name: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.prisma.payrollPartner.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: partner.id,
        entityName: partner.name,
        metadata: {
          email: partner.contactEmail,
          status: partner.status,
        },
        tenantId: ctx.tenantId,
      })

      return partner
    }),


  // -------------------------------------------------------
  // UPDATE PAYROLL PARTNER (tenant)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const partner = await ctx.prisma.payrollPartner.update({
        where: { id, tenantId: ctx.tenantId },
        data: updateData,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: partner.id,
        entityName: partner.name,
        metadata: { updatedFields: updateData },
        tenantId: ctx.tenantId,
      })

      return partner
    }),


  // -------------------------------------------------------
  // DELETE PAYROLL PARTNER (tenant)
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.prisma.payrollPartner.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      // TS fix (non-null assertion)
      const partnerSafe = partner!

      const deleted = await ctx.prisma.payrollPartner.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: partnerSafe.id,
        entityName: partnerSafe.name,
        metadata: { email: partnerSafe.contactEmail },
        tenantId: ctx.tenantId,
      })

      return deleted

    }),


  // -------------------------------------------------------
  // STATS (tenant)
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYROLL_PARTNER, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId },
      })

      const active = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      })

      const inactive = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId, status: "inactive" },
      })

      return { total, active, inactive }
    }),

})
