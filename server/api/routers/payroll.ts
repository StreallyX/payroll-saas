import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";

import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { PERMISSION_TREE } from "../../rbac/permissions";

export const payrollRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL PAYROLL PARTNERS
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.view))
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
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payrollPartner.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
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
      });
    }),

  // -------------------------------------------------------
  // CREATE PAYROLL PARTNER
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.create))
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
      });

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
      });

      return partner;
    }),

  // -------------------------------------------------------
  // UPDATE PAYROLL PARTNER
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.update))
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
      const { id, ...updateData } = input;

      const partner = await ctx.prisma.payrollPartner.update({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
      });

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
      });

      return partner;
    }),

  // -------------------------------------------------------
  // DELETE PAYROLL PARTNER
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.prisma.payrollPartner.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!partner) throw new Error("Payroll partner not found");

      const deleted = await ctx.prisma.payrollPartner.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: input.id,
        entityName: partner.name,
        metadata: { email: partner.contactEmail },
        tenantId: ctx.tenantId,
      });

      return deleted;
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.payroll.view))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId },
      });

      const active = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      });

      const inactive = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId, status: "inactive" },
      });

      return { total, active, inactive };
    }),
});
