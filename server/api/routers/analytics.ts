import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  protectedProcedure,
  hasPermission,
} from "../trpc";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions";

import { TRPCError } from "@trpc/server";

// -------------------------------------------------------------
// PERMISSIONS (V3)
// -------------------------------------------------------------
const CAN_VIEW_ANALYTICS = buildPermissionKey(
  Resource.REPORT,
  Action.READ,
  PermissionScope.GLOBAL
);

const CAN_VIEW_AUDIT = buildPermissionKey(
  Resource.AUDIT_LOG,
  Action.LIST,
  PermissionScope.GLOBAL
);

const CAN_VIEW_CONTRACTS = buildPermissionKey(
  Resource.CONTRACT,
  Action.READ,
  PermissionScope.GLOBAL
);

const CAN_VIEW_FINANCIAL = buildPermissionKey(
  Resource.INVOICE,
  Action.LIST,
  PermissionScope.GLOBAL
);

// -------------------------------------------------------------
// ROUTER
// -------------------------------------------------------------
export const analyticsRouter = createTRPCRouter({

  // ------------------------------------------------------------------
  // OVERVIEW STATS
  // ------------------------------------------------------------------
  getOverviewStats: tenantProcedure
    .use(hasPermission(CAN_VIEW_ANALYTICS))
    .query(async ({ ctx }) => {

      const tenantId = ctx.tenantId!;

      const [
        totalUsers,
        activeUsers,
        totalContracts,
        activeContracts,
        totalInvoices,
        paidInvoices,
        revenueAgg,
        monthlyRevenueAgg,
        recentActivity,
      ] = await Promise.all([

        // USERS
        ctx.prisma.user.count({ where: { tenantId } }),
        ctx.prisma.user.count({ where: { tenantId, isActive: true } }),

        // CONTRACTS
        ctx.prisma.contract.count({ where: { tenantId } }),
        ctx.prisma.contract.count({
          where: { tenantId, workflowStatus: "active" },
        }),

        // INVOICES
        ctx.prisma.invoice.count({ where: { tenantId } }),
        ctx.prisma.invoice.count({
          where: { tenantId, status: "paid" },
        }),

        // TOTAL REVENUE
        ctx.prisma.invoice.aggregate({
          where: { tenantId, status: "paid" },
          _sum: { totalAmount: true },
        }),

        // MONTHLY REVENUE
        ctx.prisma.invoice.aggregate({
          where: {
            tenantId,
            status: "paid",
            paidDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: { totalAmount: true },
        }),

        // RECENT AUDIT
        ctx.prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            entityType: true,
            description: true,
            createdAt: true,
            userName: true,
          },
        }),
      ]);

      return {
        users: { total: totalUsers, active: activeUsers },
        contracts: { total: totalContracts, active: activeContracts },
        invoices: { total: totalInvoices, paid: paidInvoices },
        revenue: {
          total: Number(revenueAgg._sum.totalAmount || 0),
          monthly: Number(monthlyRevenueAgg._sum.totalAmount || 0),
        },
        recentActivity,
      };
    }),


  // ------------------------------------------------------------------
  // USER ACTIVITY
  // ------------------------------------------------------------------
  getUserActivity: tenantProcedure
    .use(hasPermission(CAN_VIEW_AUDIT))
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {

      const tenantId = ctx.tenantId!;
      const dateFilter: any = {};

      if (input.startDate) dateFilter.gte = input.startDate;
      if (input.endDate) dateFilter.lte = input.endDate;

      const activity = await ctx.prisma.auditLog.groupBy({
        by: ["userId", "userName"],
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: input.limit,
      });

      return activity.map((x) => ({
        userId: x.userId,
        userName: x.userName,
        actions: x._count.id,
      }));
    }),


  // ------------------------------------------------------------------
  // ACTION TRENDS
  // ------------------------------------------------------------------
  getActionTrends: tenantProcedure
    .use(hasPermission(CAN_VIEW_AUDIT))
    .input(z.object({ days: z.number().min(1).max(90).default(30) }))
    .query(async ({ ctx, input }) => {

      const tenantId = ctx.tenantId!;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const logs = await ctx.prisma.auditLog.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
        select: {
          action: true,
          createdAt: true,
        },
      });

      const trends: Record<string, Record<string, number>> = {};

      logs.forEach((log) => {
        const date = log.createdAt.toISOString().split("T")[0];
        trends[date] ||= {};
        trends[date][log.action] = (trends[date][log.action] || 0) + 1;
      });

      return Object.entries(trends).map(([date, actions]) => ({
        date,
        ...actions,
      }));
    }),


  // ------------------------------------------------------------------
  // ENTITY DISTRIBUTION
  // ------------------------------------------------------------------
  getEntityDistribution: tenantProcedure
    .use(hasPermission(CAN_VIEW_AUDIT))
    .query(async ({ ctx }) => {

      const tenantId = ctx.tenantId!;

      const distribution = await ctx.prisma.auditLog.groupBy({
        by: ["entityType"],
        where: { tenantId },
        _count: { id: true },
      });

      return distribution.map((x) => ({
        entityType: x.entityType,
        count: x._count.id,
      }));
    }),


  // ------------------------------------------------------------------
  // CONTRACT ANALYTICS (new architecture: no contractor/agency directly)
  // ------------------------------------------------------------------
  getContractAnalytics: tenantProcedure
    .use(hasPermission(CAN_VIEW_CONTRACTS))
    .query(async ({ ctx }) => {

      const tenantId = ctx.tenantId!;

      const [status, workflow, expirations] = await Promise.all([

        ctx.prisma.contract.groupBy({
          by: ["status"],
          where: { tenantId },
          _count: { id: true },
        }),

        ctx.prisma.contract.groupBy({
          by: ["workflowStatus"],
          where: { tenantId },
          _count: { id: true },
        }),

        ctx.prisma.contract.findMany({
          where: {
            tenantId,
            endDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            participants: {
              include: {
                user: { select: { name: true } },
                company: { select: { name: true } },
              },
            },
          },
          take: 10,
        }),
      ]);

      return {
        status: status.map((s) => ({ status: s.status, count: s._count.id })),
        workflow: workflow.map((w) => ({
          workflowStatus: w.workflowStatus,
          count: w._count.id,
        })),
        expirations,
      };
    }),


  // ------------------------------------------------------------------
  // FINANCIAL ANALYTICS
  // ------------------------------------------------------------------
  getFinancialAnalytics: tenantProcedure
    .use(hasPermission(CAN_VIEW_FINANCIAL))
    .input(z.object({ months: z.number().min(1).max(24).default(12) }))
    .query(async ({ ctx, input }) => {

      const tenantId = ctx.tenantId!;
      const start = new Date();
      start.setMonth(start.getMonth() - input.months);

      const invoices = await ctx.prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: start },
        },
        select: {
          status: true,
          totalAmount: true,
          issueDate: true,
        },
      });

      const monthly: Record<string, any> = {};

      invoices.forEach((inv) => {
        const month = inv.issueDate.toISOString().slice(0, 7);
        monthly[month] ||= { invoices: 0, paid: 0, pending: 0, revenue: 0 };

        monthly[month].invoices++;
        monthly[month].revenue += Number(inv.totalAmount);

        if (inv.status === "paid") monthly[month].paid++;
        else monthly[month].pending++;
      });

      return {
        monthly: Object.entries(monthly).map(([m, d]) => ({ month: m, ...d })),
        totalRevenue: invoices
          .filter((i) => i.status === "paid")
          .reduce((a, b) => a + Number(b.totalAmount), 0),
      };
    }),
});
