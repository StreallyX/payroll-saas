import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = createTRPCRouter({

  // ------------------------------------------------------------------
  // GET DASHBOARD STATS
  // ------------------------------------------------------------------
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const userPermissions = ctx.session.user.permissions || [];
    const isSuperAdmin = ctx.session.user.isSuperAdmin;

    const hasPermission = (perm: string) =>
      isSuperAdmin || userPermissions.includes(perm);

    const stats: any = {
      contractors: null,
      contracts: null,
      invoices: null,
      agencies: null,
      payslips: null,
      users: null,
      tasks: null,
      leads: null,
    };

    try {
      // ---------------- CONTRACTORS ----------------
      if (hasPermission("contractors.manage.view_all")) {
        const total = await ctx.prisma.contractor.count({
          where: { tenantId: ctx.tenantId },
        });

        const active = await ctx.prisma.contractor.count({
          where: {
            tenantId: ctx.tenantId,
            contracts: { some: { status: "active" } },
          },
        });

        stats.contractors = {
          total,
          active,
          inactive: total - active,
        };
      }

      // ---------------- CONTRACTS ----------------
      if (hasPermission("contracts.manage.view_all")) {
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

        stats.contracts = {
          total,
          active,
          pending,
          draft,
        };
      }

      // ---------------- INVOICES ----------------
      if (hasPermission("invoices.manage.view_all")) {
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

      // ---------------- AGENCIES ----------------
      if (hasPermission("agencies.manage.view_all")) {
        const total = await ctx.prisma.agency.count({
          where: { tenantId: ctx.tenantId },
        });

        const active = await ctx.prisma.agency.count({
          where: { tenantId: ctx.tenantId, status: "active" },
        });

        stats.agencies = {
          total,
          active,
          inactive: total - active,
        };
      }

      // ---------------- PAYSLIPS ----------------
      if (hasPermission("payments.payslips.view_all")) {
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
      if (hasPermission("tenant.users.view")) {
        const total = await ctx.prisma.user.count({
          where: { tenantId: ctx.tenantId },
        });

        const active = await ctx.prisma.user.count({
          where: { tenantId: ctx.tenantId, isActive: true },
        });

        stats.users = {
          total,
          active,
          inactive: total - active,
        };
      }

      // ---------------- TASKS ----------------
      if (hasPermission("tasks.view_all")) {
        const total = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId },
        });

        const pending = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId, status: "pending" },
        });

        const completed = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId, status: "completed" },
        });

        stats.tasks = {
          total,
          pending,
          completed,
        };
      }

      // ---------------- LEADS ----------------
      if (hasPermission("leads.view")) {
        const total = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId },
        });

        const newLeads = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId, status: "new" },
        });

        const converted = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId, status: "converted" },
        });

        stats.leads = {
          total,
          new: newLeads,
          converted,
        };
      }

      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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
      const userPermissions = ctx.session.user.permissions || [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      const hasPermission = (perm: string) =>
        isSuperAdmin || userPermissions.includes(perm);

      if (!hasPermission("audit.view")) return [];

      try {
        return await ctx.prisma.auditLog.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityName: true,
            userName: true,
            userRole: true,
            createdAt: true,
            description: true,
          },
        });
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        return [];
      }
    }),

  // ------------------------------------------------------------------
  // UPCOMING EXPIRATIONS
  // ------------------------------------------------------------------
  getUpcomingExpirations: tenantProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const perms = ctx.session.user.permissions || [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      const hasPermission = (perm: string) =>
        isSuperAdmin || perms.includes(perm);

      if (!hasPermission("contracts.manage.view_all")) return [];

      try {
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + input.days);

        return await ctx.prisma.contract.findMany({
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
            contractor: { select: { name: true } },
            agency: { select: { name: true } },
          },
        });
      } catch (error) {
        console.error("Error fetching expirations:", error);
        return [];
      }
    }),

});
