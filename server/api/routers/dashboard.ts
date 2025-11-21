import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions-v2";

// --------------------------------------------
// RBAC V2 PERMISSIONS
// --------------------------------------------
const CAN_VIEW_CONTRACTS_ALL = buildPermissionKey(
  Resource.CONTRACT,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_INVOICES_ALL = buildPermissionKey(
  Resource.INVOICE,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_PAYSLIPS_ALL = buildPermissionKey(
  Resource.PAYSLIP,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_USERS_ALL = buildPermissionKey(
  Resource.USER,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_TASKS_ALL = buildPermissionKey(
  Resource.TASK,
  Action.READ,
  PermissionScope.OWN
);

const CAN_VIEW_LEADS_ALL = buildPermissionKey(
  Resource.LEAD,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_AUDIT_ALL = buildPermissionKey(
  Resource.AUDIT_LOG,
  Action.LIST,
  PermissionScope.GLOBAL
);

export const dashboardRouter = createTRPCRouter({

  // ------------------------------------------------------------------
  // GET DASHBOARD STATS
  // ------------------------------------------------------------------
  getStats: tenantProcedure.query(async ({ ctx }) => {

    const userPermissions = ctx.session.user.permissions || [];
    const isSuperAdmin = ctx.session.user.isSuperAdmin;

    const hasPermission = (key: string) =>
      isSuperAdmin || userPermissions.includes(key);

    const stats: any = {
      contracts: null,
      invoices: null,
      payslips: null,
      users: null,
      tasks: null,
      leads: null,
    };

    try {

      // ---------------- CONTRACTS ----------------
      if (hasPermission(CAN_VIEW_CONTRACTS_ALL)) {
        const total = await ctx.prisma.contract.count({
          where: { tenantId: ctx.tenantId },
        });

        const active = await ctx.prisma.contract.count({
          where: { tenantId: ctx.tenantId, status: "active" },
        });

        const pending = await ctx.prisma.contract.count({
          where: { tenantId: ctx.tenantId, status: "pending" },
        });

        const draft = await ctx.prisma.contract.count({
          where: { tenantId: ctx.tenantId, status: "draft" },
        });

        stats.contracts = { total, active, pending, draft };
      }

      // ---------------- INVOICES ----------------
      if (hasPermission(CAN_VIEW_INVOICES_ALL)) {
        const total = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId },
        });

        const paid = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId, status: "paid" },
        });

        const pending = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId, status: "pending" },
        });

        const overdue = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId, status: "overdue" },
        });

        const revenue = await ctx.prisma.invoice.aggregate({
          where: { tenantId: ctx.tenantId, status: "paid" },
          _sum: { amount: true },
        });

        stats.invoices = {
          total,
          paid,
          pending,
          overdue,
          totalRevenue: Number(revenue._sum.amount) || 0,
        };
      }

      // ---------------- PAYSLIPS ----------------
      if (hasPermission(CAN_VIEW_PAYSLIPS_ALL)) {
        const total = await ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId },
        });

        const processed = await ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId, status: "processed" },
        });

        stats.payslips = {
          total,
          processed,
          pending: total - processed,
        };
      }

      // ---------------- USERS ----------------
      if (hasPermission(CAN_VIEW_USERS_ALL)) {
        const total = await ctx.prisma.user.count({
          where: { tenantId: ctx.tenantId },
        });

        const active = await ctx.prisma.user.count({
          where: { tenantId: ctx.tenantId, isActive: true },
        });

        stats.users = { total, active, inactive: total - active };
      }

      // ---------------- TASKS ----------------
      if (hasPermission(CAN_VIEW_TASKS_ALL)) {
        const total = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId },
        });

        const pending = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId, status: "pending" },
        });

        const completed = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId, status: "completed" },
        });

        stats.tasks = { total, pending, completed };
      }

      // ---------------- LEADS ----------------
      if (hasPermission(CAN_VIEW_LEADS_ALL)) {
        const total = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId },
        });

        const newLeads = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId, status: "new" },
        });

        const converted = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId, status: "converted" },
        });

        stats.leads = { total, new: newLeads, converted };
      }

      return stats;

    } catch (err) {
      console.error("Dashboard error:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard statistics",
      });
    }
  }),

  // ------------------------------------------------------------------
  // RECENT ACTIVITIES
  // ------------------------------------------------------------------
  getRecentActivities: tenantProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {

      const perms = ctx.session.user.permissions || [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      const allowed = isSuperAdmin || perms.includes(CAN_VIEW_AUDIT_ALL);

      if (!allowed) return [];

      return ctx.prisma.auditLog.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // ------------------------------------------------------------------
// EXPIRING CONTRACTS
// ------------------------------------------------------------------
getUpcomingExpirations: tenantProcedure
  .input(z.object({ days: z.number().min(1).max(365).default(30) }))
  .query(async ({ ctx, input }) => {
    const perms = ctx.session.user.permissions || [];
    const isSuperAdmin = ctx.session.user.isSuperAdmin;

    const hasPermission = (perm: string) =>
      isSuperAdmin || perms.includes(perm);

    if (!hasPermission(CAN_VIEW_CONTRACTS_ALL)) return [];

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + input.days);

    return ctx.prisma.contract.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "active",
        endDate: { gte: today, lte: future },
      },
      orderBy: { endDate: "asc" },
      take: 10,
      select: {
        id: true,
        title: true,
        endDate: true,
        // NEW structure
        company: {
          select: {
            name: true
          }
        },
        participants: {
          select: {
            role: true,
            isPrimary: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  })


});
