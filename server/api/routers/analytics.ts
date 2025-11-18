
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  hasPermission,
} from "../trpc";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions-v2";
import { TRPCError } from "@trpc/server";

/**
 * Analytics Router - Phase 9
 * Provides comprehensive analytics and reporting capabilities
 */
export const analyticsRouter = createTRPCRouter({
  /**
   * Get overview stats for admin dashboard
   */
  getOverviewStats: protectedProcedure
    .use(hasPermission("audit.read.global"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session!.user.tenantId;

      const [
        totalUsers,
        activeUsers,
        totalContractors,
        activeContractors,
        totalContracts,
        activeContracts,
        totalInvoices,
        paidInvoices,
        totalAgencies,
        totalRevenue,
        monthlyRevenue,
        recentActivity,
      ] = await Promise.all([
        // Users
        ctx.prisma.user.count({ where: { tenantId } }),
        ctx.prisma.user.count({ where: { tenantId, isActive: true } }),

        // Contractors
        ctx.prisma.contractor.count({ where: { tenantId } }),
        ctx.prisma.contractor.count({ where: { tenantId, status: "active" } }),

        // Contracts
        ctx.prisma.contract.count({ where: { tenantId } }),
        ctx.prisma.contract.count({
          where: { tenantId, workflowStatus: "active" },
        }),

        // Invoices
        ctx.prisma.invoice.count({ where: { tenantId } }),
        ctx.prisma.invoice.count({ where: { tenantId, status: "paid" } }),

        // Agencies
        ctx.prisma.agency.count({ where: { tenantId } }),

        // Revenue
        ctx.prisma.invoice.aggregate({
          where: { tenantId, status: "paid" },
          _sum: { totalAmount: true },
        }),

        // Monthly Revenue
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

        // Recent Activity
        ctx.prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

      return {
        users: { total: totalUsers, active: activeUsers },
        contractors: { total: totalContractors, active: activeContractors },
        contracts: { total: totalContracts, active: activeContracts },
        invoices: { total: totalInvoices, paid: paidInvoices },
        agencies: { total: totalAgencies },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          monthly: monthlyRevenue._sum.totalAmount || 0,
        },
        recentActivity,
      };
    }),

  /**
   * Get user activity breakdown
   */
  getUserActivity: protectedProcedure
    .use(hasPermission("audit.read.global"))
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId;

      const dateFilter: any = {};
      if (input.startDate) {
        dateFilter.gte = input.startDate;
      }
      if (input.endDate) {
        dateFilter.lte = input.endDate;
      }

      const userActivity = await ctx.prisma.auditLog.groupBy({
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

      return userActivity.map((activity) => ({
        userId: activity.userId,
        userName: activity.userName,
        actionCount: activity._count.id,
      }));
    }),

  /**
   * Get action breakdown over time
   */
  getActionTrends: protectedProcedure
    .use(hasPermission("audit.read.global"))
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId;
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

      // Group by date and action
      const trends: Record<
        string,
        Record<string, number>
      > = {};

      logs.forEach((log) => {
        const date = log.createdAt.toISOString().split("T")[0];
        if (!trends[date]) {
          trends[date] = {};
        }
        trends[date][log.action] = (trends[date][log.action] || 0) + 1;
      });

      return Object.entries(trends).map(([date, actions]) => ({
        date,
        ...actions,
      }));
    }),

  /**
   * Get entity type distribution
   */
  getEntityDistribution: protectedProcedure
    .use(hasPermission("audit.read.global"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session!.user.tenantId;

      const distribution = await ctx.prisma.auditLog.groupBy({
        by: ["entityType"],
        where: { tenantId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      return distribution.map((item) => ({
        entityType: item.entityType,
        count: item._count.id,
      }));
    }),

  /**
   * Get contract analytics
   */
  getContractAnalytics: protectedProcedure
    .use(hasPermission("contract.read.global"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session!.user.tenantId;

      const [statusBreakdown, workflowBreakdown, expiringContracts] =
        await Promise.all([
          // Status breakdown
          ctx.prisma.contract.groupBy({
            by: ["status"],
            where: { tenantId },
            _count: { id: true },
          }),

          // Workflow status breakdown
          ctx.prisma.contract.groupBy({
            by: ["workflowStatus"],
            where: { tenantId },
            _count: { id: true },
          }),

          // Expiring contracts (next 30 days)
          ctx.prisma.contract.findMany({
            where: {
              tenantId,
              endDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              contractor: {
                select: { name: true },
              },
              agency: {
                select: { name: true },
              },
            },
            take: 10,
          }),
        ]);

      return {
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        workflowBreakdown: workflowBreakdown.map((item) => ({
          workflowStatus: item.workflowStatus,
          count: item._count.id,
        })),
        expiringContracts,
      };
    }),

  /**
   * Get financial analytics
   */
  getFinancialAnalytics: protectedProcedure
    .use(hasPermission("contract.read.global"))
    .input(
      z.object({
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const invoices = await ctx.prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          totalAmount: true,
          issueDate: true,
          paidDate: true,
        },
      });

      // Monthly breakdown
      const monthlyData: Record<
        string,
        { revenue: number; invoices: number; paid: number; pending: number }
      > = {};

      invoices.forEach((invoice) => {
        const month = invoice.issueDate.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            revenue: 0,
            invoices: 0,
            paid: 0,
            pending: 0,
          };
        }

        monthlyData[month].invoices += 1;
        monthlyData[month].revenue += Number(invoice.totalAmount);

        if (invoice.status === "paid") {
          monthlyData[month].paid += 1;
        } else {
          monthlyData[month].pending += 1;
        }
      });

      // Status breakdown
      const statusBreakdown = await ctx.prisma.invoice.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      return {
        monthlyData: Object.entries(monthlyData)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: item._count.id,
          total: Number(item._sum.totalAmount || 0),
        })),
        totalRevenue: invoices
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + Number(i.totalAmount), 0),
        pendingRevenue: invoices
          .filter((i) => i.status !== "paid")
          .reduce((sum, i) => sum + Number(i.totalAmount), 0),
      };
    }),

  /**
   * Export analytics report
   */
  exportReport: protectedProcedure
    .use(hasPermission("audit.export.global"))
    .input(
      z.object({
        reportType: z.enum(["audit", "financial", "contracts", "users"]),
        format: z.enum(["csv", "json"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session!.user.tenantId;

      // This is a placeholder - actual file generation would happen here
      // For now, we'll return the data structure

      let data: any;

      switch (input.reportType) {
        case "audit":
          data = await ctx.prisma.auditLog.findMany({
            where: {
              tenantId,
              ...(input.startDate && {
                createdAt: { gte: input.startDate },
              }),
              ...(input.endDate && {
                createdAt: { lte: input.endDate },
              }),
            },
            orderBy: { createdAt: "desc" },
          });
          break;

        case "financial":
          data = await ctx.prisma.invoice.findMany({
            where: { tenantId },
            include: {
              contract: {
                select: {
                  contractReference: true,
                },
              },
            },
          });
          break;

        case "contracts":
          data = await ctx.prisma.contract.findMany({
            where: { tenantId },
            include: {
              contractor: { select: { name: true } },
              agency: { select: { name: true } },
            },
          });
          break;

        case "users":
          data = await ctx.prisma.user.findMany({
            where: { tenantId },
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              role: { select: { name: true } },
              createdAt: true,
            },
          });
          break;

        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid report type",
          });
      }

      // Log the export
      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || "Unknown",
          userRole: ctx.session!.user.roleName,
          action: "EXPORT",
          entityType: input.reportType.toUpperCase(),
          description: `Exported ${input.reportType} report in ${input.format} format`,
        },
      });

      return {
        success: true,
        data,
        format: input.format,
        exportedAt: new Date(),
      };
    }),
});
