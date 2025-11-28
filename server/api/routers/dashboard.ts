import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions";

// -------------------------------------------------------------
// PERMISSIONS
// -------------------------------------------------------------
const PERM_CONTRACTS_GLOBAL = buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL);
const PERM_INVOICES_GLOBAL = buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL);
const PERM_PAYSLIPS_GLOBAL = buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL);
const PERM_USERS_GLOBAL = buildPermissionKey(Resource.USER, Action.LIST, PermissionScope.GLOBAL);
const PERM_TASKS_OWN = buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN);
const PERM_LEADS_GLOBAL = buildPermissionKey(Resource.LEAD, Action.LIST, PermissionScope.GLOBAL);
const PERM_AUDIT_GLOBAL = buildPermissionKey(Resource.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL);

export const dashboardRouter = createTRPCRouter({


  // =====================================================================
  // 📊 DASHBOARD STATS — GLOBAL OR OWN
  // =====================================================================
  getStats: tenantProcedure.query(async ({ ctx }) => {

    const perms = ctx.session.user.permissions ?? [];
    const isSuperAdmin = ctx.session.user.isSuperAdmin;
    const userId = ctx.session.user.id;

    const has = (perm: string) =>
      isSuperAdmin || perms.includes(perm);

    const stats: any = {
      contracts: null,
      invoices: null,
      payslips: null,
      users: null,
      tasks: null,
      leads: null,
    };

    // ------------------------------------------------------------------
    // CONTRACTS
    // ------------------------------------------------------------------
    if (has(PERM_CONTRACTS_GLOBAL)) {
      const total = await ctx.prisma.contract.count({ where: { tenantId: ctx.tenantId } });
      const active = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      });
      const pending = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId, status: "pending" },
      });

      stats.contracts = { total, active, pending, draft: total - active - pending };
    } else {
      // OWN fallback: contracts where the user is a participant
      const total = await ctx.prisma.contract.count({
        where: {
          tenantId: ctx.tenantId,
          participants: { some: { userId } },
        },
      });

      stats.contracts = {
        total,
        active: total,
        pending: 0,
        draft: 0,
      };
    }

    // ------------------------------------------------------------------
    // INVOICES
    // ------------------------------------------------------------------
    if (has(PERM_INVOICES_GLOBAL)) {
      const total = await ctx.prisma.invoice.count({ where: { tenantId: ctx.tenantId } });
      const paid = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId, status: "paid" },
      });
      const pending = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId, status: "pending" },
      });
      const overdue = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId, status: "overdue" },
      });

      stats.invoices = { total, paid, pending, overdue };
    } else {
      // OWN fallback: invoices created by the user
      const total = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId, createdBy: userId },
      });

      stats.invoices = {
        total,
        paid: 0,
        pending: 0,
        overdue: 0,
      };
    }

    // ------------------------------------------------------------------
    // PAYSLIPS
    // ------------------------------------------------------------------
    if (has(PERM_PAYSLIPS_GLOBAL)) {
      const total = await ctx.prisma.payslip.count({ where: { tenantId: ctx.tenantId } });
      const processed = await ctx.prisma.payslip.count({
        where: { tenantId: ctx.tenantId, status: "processed" },
      });

      stats.payslips = { total, processed, pending: total - processed };
    } else {
      // OWN fallback
      const total = await ctx.prisma.payslip.count({
        where: { tenantId: ctx.tenantId, userId },
      });

      stats.payslips = {
        total,
        processed: total,
        pending: 0,
      };
    }

    // ------------------------------------------------------------------
    // USERS
    // ------------------------------------------------------------------
    if (has(PERM_USERS_GLOBAL)) {
      const total = await ctx.prisma.user.count({ where: { tenantId: ctx.tenantId } });
      const active = await ctx.prisma.user.count({
        where: { tenantId: ctx.tenantId, isActive: true },
      });

      stats.users = { total, active, inactive: total - active };
    } else {
      // OWN fallback: only yourself
      stats.users = {
        total: 1,
        active: 1,
        inactive: 0,
      };
    }

    // ------------------------------------------------------------------
    // TASKS
    // ------------------------------------------------------------------
    // ---------------- TASKS (OWN) ----------------
    if (has(PERM_TASKS_OWN)) {
      const total = await ctx.prisma.task.count({
        where: {
          tenantId: ctx.tenantId,
          assignedTo: userId,        // ✅ FIX
        },
      });

      const completed = await ctx.prisma.task.count({
        where: {
          tenantId: ctx.tenantId,
          assignedTo: userId,        // ✅ FIX
          status: "completed",
        },
      });

      stats.tasks = {
        total,
        pending: total - completed,
        completed,
      };
    }


    // ------------------------------------------------------------------
    // LEADS
    // ------------------------------------------------------------------
    if (has(PERM_LEADS_GLOBAL)) {
      const total = await ctx.prisma.lead.count({ where: { tenantId: ctx.tenantId } });

      const newLeads = await ctx.prisma.lead.count({
        where: { tenantId: ctx.tenantId, status: "new" },
      });

      const converted = await ctx.prisma.lead.count({
        where: { tenantId: ctx.tenantId, status: "converted" },
      });

      stats.leads = { total, new: newLeads, converted };
    }

    return stats;
  }),


  // =====================================================================
  // RECENT ACTIVITIES — GLOBAL ONLY
  // =====================================================================
  getRecentActivities: tenantProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {

      const perms = ctx.session.user.permissions ?? [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      if (!isSuperAdmin && !perms.includes(PERM_AUDIT_GLOBAL)) return [];

      return ctx.prisma.auditLog.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),


  // =====================================================================
  // EXPIRING CONTRACTS — GLOBAL ONLY
  // =====================================================================
  getUpcomingExpirations: tenantProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {

      const perms = ctx.session.user.permissions ?? [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      if (!isSuperAdmin && !perms.includes(PERM_CONTRACTS_GLOBAL)) return [];

      const today = new Date();
      const future = new Date(today);
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
          participants: {
            include: {
              user: { select: { name: true, email: true } },
              company: { select: { name: true } },
            },
          },
        },
      });
    }),

});
