import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { TRPCError } from "@trpc/server";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";

// -------------------------------------------------------
// PERMISSIONS
// -------------------------------------------------------
const VIEW_ALL = buildPermissionKey(
  Resource.PAYSLIP,
  Action.READ,
  PermissionScope.GLOBAL
);
const VIEW_OWN = buildPermissionKey(
  Resource.PAYSLIP,
  Action.READ,
  PermissionScope.OWN
);
const CREATE = buildPermissionKey(
  Resource.PAYSLIP,
  Action.CREATE,
  PermissionScope.GLOBAL
);
const UPDATE = buildPermissionKey(
  Resource.PAYSLIP,
  Action.UPDATE,
  PermissionScope.GLOBAL
);
const DELETE = buildPermissionKey(
  Resource.PAYSLIP,
  Action.DELETE,
  PermissionScope.GLOBAL
);

// If you have an Action.SEND in your enum
// const SEND = buildPermissionKey(Resource.PAYSLIP, Action.SEND, PermissionScope.GLOBAL);

export const payslipRouter = createTRPCRouter({
  // -------------------------------------------------------
  // GET ALL / OWN PAYSLIPS (AUTO-SCOPE)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
    .query(async ({ ctx }) => {
      const sessionUser = ctx.session!.user;
      const tenantId = ctx.tenantId!;
      const userId = sessionUser.id;

      const permissions = sessionUser.permissions || [];
      const hasGlobal = permissions.includes(VIEW_ALL);

      const where: any = { tenantId };

      // If user does NOT have global permission → we limit to their own payslips
      if (!hasGlobal) {
        where.userId = userId;
      }

      return ctx.prisma.payslip.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contract: {
            select: {
              id: true,
              title: true,
              contractReference: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
    }),

  // -------------------------------------------------------
  // GET BY ID (OWN vs GLOBAL)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sessionUser = ctx.session!.user;
      const tenantId = ctx.tenantId!;
      const permissions = sessionUser.permissions || [];
      const hasGlobal = permissions.includes(VIEW_ALL);

      const payslip = await ctx.prisma.payslip.findFirst({
        where: {
          id: input.id,
          tenantId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contract: {
            select: {
              id: true,
              title: true,
              contractReference: true,
            },
          },
        },
      });

      if (!payslip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payslip not found",
        });
      }

      // If user only has OWN → we verify they own the payslip
      if (!hasGlobal && payslip.userId !== sessionUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not allowed to access this payslip",
        });
      }

      return payslip;
    }),

  // -------------------------------------------------------
  // GET MY PAYSLIPS (PORTAIL CONTRACTOR)
  // -------------------------------------------------------
  getMyPayslips: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!;
      const userId = ctx.session!.user.id;

      return ctx.prisma.payslip.findMany({
        where: {
          tenantId,
          userId,
        },
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              contractReference: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
    }),

  // -------------------------------------------------------
  // CREATE PAYSLIP
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(CREATE))
    .input(
      z.object({
        userId: z.string(), // using userId, no longer contractorId
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
      const tenantId = ctx.tenantId!;
      const sessionUser = ctx.session!.user;

      const payslip = await ctx.prisma.payslip.create({
        data: {
          tenantId,
          userId: input.userId,
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
          generatedBy: sessionUser.id,
        },
        include: {
          user: true,
          contract: true,
        },
      });

      await createAuditLog({
        userId: sessionUser.id,
        userName: sessionUser.name ?? "Unknown",
        userRole: sessionUser.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Created payslip for ${payslip.user.name ?? payslip.user.email}`,
        tenantId,
      });

      return payslip;
    }),

  // -------------------------------------------------------
  // UPDATE PAYSLIP
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
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
      const tenantId = ctx.tenantId!;
      const sessionUser = ctx.session!.user;

      const payslip = await ctx.prisma.payslip.update({
        where: { id: input.id },
        data: {
          userId: input.userId,
          contractId: input.contractId,
          month: input.month,
          year: input.year,
          grossPay: input.grossPay,
          netPay: input.netPay,
          deductions: input.deductions,
          tax: input.tax,
          status: input.status,
          sentDate: input.sentDate ? new Date(input.sentDate) : undefined,
          paidDate: input.paidDate ? new Date(input.paidDate) : undefined,
          notes: input.notes,
        },
        include: {
          user: true,
          contract: true,
        },
      });

      await createAuditLog({
        userId: sessionUser.id,
        userName: sessionUser.name ?? "Unknown",
        userRole: sessionUser.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Updated payslip for ${payslip.user.name ?? payslip.user.email}`,
        tenantId,
      });

      return payslip;
    }),

  // -------------------------------------------------------
  // DELETE PAYSLIP
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!;
      const sessionUser = ctx.session!.user;

      const payslip = await ctx.prisma.payslip.findFirst({
        where: { id: input.id, tenantId },
        include: {
          user: true,
        },
      });

      if (!payslip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payslip not found",
        });
      }

      await ctx.prisma.payslip.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        userId: sessionUser.id,
        userName: sessionUser.name ?? "Unknown",
        userRole: sessionUser.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip ${payslip.month}/${payslip.year}`,
        description: `Deleted payslip for ${payslip.user.name ?? payslip.user.email}`,
        tenantId,
      });

      return { success: true };
    }),

  // -------------------------------------------------------
  // STATS (OWN vs GLOBAL)
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasAnyPermission([VIEW_ALL, VIEW_OWN]))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId!;
      const sessionUser = ctx.session!.user;
      const permissions = sessionUser.permissions || [];
      const hasGlobal = permissions.includes(VIEW_ALL);

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const baseWhere: any = { tenantId };
      if (!hasGlobal) {
        baseWhere.userId = sessionUser.id;
      }

      const [thisMonth, generated, sent, pending] = await Promise.all([
        ctx.prisma.payslip.count({
          where: { ...baseWhere, month, year },
        }),
        ctx.prisma.payslip.count({
          where: { ...baseWhere, status: "generated" },
        }),
        ctx.prisma.payslip.count({
          where: { ...baseWhere, status: "sent" },
        }),
        ctx.prisma.payslip.count({
          where: { ...baseWhere, status: "pending" },
        }),
      ]);

      return { thisMonth, generated, sent, pending };
    }),
});
