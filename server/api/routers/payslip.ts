import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";

export const payslipRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL PAYSLIPS
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.view_all))
    .query(async ({ ctx }) => {
      return ctx.prisma.payslip.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          contractor: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          contract: {
            select: { id: true, title: true, contractReference: true },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.view_all))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payslip.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contractor: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          contract: {
            select: { id: true, title: true, contractReference: true },
          },
        },
      });
    }),

  // -------------------------------------------------------
  // GET BY CONTRACTOR
  // -------------------------------------------------------
  getByContractorId: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.view_all))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payslip.findMany({
        where: { contractorId: input.contractorId, tenantId: ctx.tenantId },
        include: {
          contract: {
            select: { id: true, title: true, contractReference: true },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
    }),

  // -------------------------------------------------------
  // CREATE PAYSLIP
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.generate))
    .input(
      z.object({
        contractorId: z.string(),
        contractId: z.string().optional(),
        month: z.number().min(1).max(12),
        year: z.number().min(2020).max(2100),
        grossPay: z.number().min(0),
        netPay: z.number().min(0),
        deductions: z.number().min(0).default(0),
        tax: z.number().min(0).default(0),
        status: z.enum(["pending", "generated", "sent", "paid"]),
        sentDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payslip = await ctx.prisma.payslip.create({
        data: {
          tenantId: ctx.tenantId,
          contractorId: input.contractorId,
          contractId: input.contractId,
          month: input.month,
          year: input.year,
          grossPay: input.grossPay,
          netPay: input.netPay,
          deductions: input.deductions,
          tax: input.tax,
          status: input.status,
          sentDate: input.sentDate ? new Date(input.sentDate) : null,
          paidDate: input.paidDate ? new Date(input.paidDate) : null,
          notes: input.notes,
        },
        include: {
          contractor: { include: { user: true } },
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Created payslip for ${payslip.contractor.user.name}`,
        tenantId: ctx.tenantId,
      });

      return payslip;
    }),

  // -------------------------------------------------------
  // UPDATE PAYSLIP
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.generate))
    .input(
      z.object({
        id: z.string(),
        contractorId: z.string().optional(),
        contractId: z.string().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).max(2100).optional(),
        grossPay: z.number().min(0).optional(),
        netPay: z.number().min(0).optional(),
        deductions: z.number().min(0).optional(),
        tax: z.number().min(0).optional(),
        status: z.enum(["pending", "generated", "sent", "paid"]).optional(),
        sentDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payslip = await ctx.prisma.payslip.update({
        where: { id: input.id },
        data: {
          ...input,
          sentDate: input.sentDate ? new Date(input.sentDate) : undefined,
          paidDate: input.paidDate ? new Date(input.paidDate) : undefined,
        },
        include: {
          contractor: { include: { user: true } },
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Updated payslip for ${payslip.contractor.user.name}`,
        tenantId: ctx.tenantId,
      });

      return payslip;
    }),

  // -------------------------------------------------------
  // DELETE PAYSLIP
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.generate))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payslip = await ctx.prisma.payslip.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { contractor: { include: { user: true } } },
      });

      if (!payslip) throw new Error("Payslip not found");

      await ctx.prisma.payslip.delete({ where: { id: input.id } });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Deleted payslip for ${payslip.contractor.user.name}`,
        tenantId: ctx.tenantId,
      });

      return { success: true };
    }),

  // -------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payslips.view_all))
    .query(async ({ ctx }) => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [thisMonth, generated, sent, pending] = await Promise.all([
        ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId, month, year },
        }),
        ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId, status: "generated" },
        }),
        ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId, status: "sent" },
        }),
        ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId, status: "pending" },
        }),
      ]);

      return { thisMonth, generated, sent, pending };
    }),
});
