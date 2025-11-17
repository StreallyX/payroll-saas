import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";

export const dashboardRouter = createTRPCRouter({
  /**
   * Get dashboard statistics based on user role and permissions
   */
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userPermissions = ctx.session.user.permissions || [];
    const isSuperAdmin = ctx.session.user.isSuperAdmin;

    // Helper to check permission
    const hasPermission = (permission: string) => 
      isSuperAdmin || userPermissions.includes(permission);

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
      // Contractors stats
      if (hasPermission(PERMISSION_TREE_V2.contractors.manage.view_all)) {
        const totalContractors = await ctx.prisma.contractor.count({
          where: { tenantId: ctx.tenantId },
        });
        
        const activeContractors = await ctx.prisma.contractor.count({
          where: { 
            tenantId: ctx.tenantId,
            contracts: {
              some: {
                status: "active"
              }
            }
          },
        });

        stats.contractors = {
          total: totalContractors,
          active: activeContractors,
          inactive: totalContractors - activeContractors,
        };
      }

      // Contracts stats
      if (hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all)) {
        const totalContracts = await ctx.prisma.contract.count({
          where: { tenantId: ctx.tenantId },
        });

        const activeContracts = await ctx.prisma.contract.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "active"
          },
        });

        const pendingContracts = await ctx.prisma.contract.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "pending"
          },
        });

        stats.contracts = {
          total: totalContracts,
          active: activeContracts,
          pending: pendingContracts,
          draft: await ctx.prisma.contract.count({
            where: { tenantId: ctx.tenantId, status: "draft" }
          }),
        };
      }

      // Invoices stats
      if (hasPermission(PERMISSION_TREE_V2.invoices.manage.view_all)) {
        const totalInvoices = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId },
        });

        const paidInvoices = await ctx.prisma.invoice.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "paid"
          },
        });

        const pendingInvoices = await ctx.prisma.invoice.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "pending"
          },
        });

        const overdueInvoices = await ctx.prisma.invoice.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "overdue"
          },
        });

        // Calculate total revenue from paid invoices
        const revenueData = await ctx.prisma.invoice.aggregate({
          where: { 
            tenantId: ctx.tenantId,
            status: "paid"
          },
          _sum: {
            amount: true,
          },
        });

        stats.invoices = {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices,
          totalRevenue: Number(revenueData._sum.amount) || 0,
        };
      }

      // Agencies stats
      if (hasPermission(PERMISSION_TREE_V2.agencies.manage.view_all)) {
        const totalAgencies = await ctx.prisma.agency.count({
          where: { tenantId: ctx.tenantId },
        });

        const activeAgencies = await ctx.prisma.agency.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "active"
          },
        });

        stats.agencies = {
          total: totalAgencies,
          active: activeAgencies,
          inactive: totalAgencies - activeAgencies,
        };
      }

      // Payslips stats
      if (hasPermission(PERMISSION_TREE_V2.payments.payslips.view_all)) {
        const totalPayslips = await ctx.prisma.payslip.count({
          where: { tenantId: ctx.tenantId },
        });

        const processedPayslips = await ctx.prisma.payslip.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "processed"
          },
        });

        stats.payslips = {
          total: totalPayslips,
          processed: processedPayslips,
          pending: totalPayslips - processedPayslips,
        };
      }

      // Users stats
      if (hasPermission(PERMISSION_TREE_V2.tenant.users.view)) {
        const totalUsers = await ctx.prisma.user.count({
          where: { tenantId: ctx.tenantId },
        });

        const activeUsers = await ctx.prisma.user.count({
          where: { 
            tenantId: ctx.tenantId,
            isActive: true
          },
        });

        stats.users = {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        };
      }

      // Tasks stats
      if (hasPermission(PERMISSION_TREE_V2.tasks.view_all)) {
        const totalTasks = await ctx.prisma.task.count({
          where: { tenantId: ctx.tenantId },
        });

        const pendingTasks = await ctx.prisma.task.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "pending"
          },
        });

        const completedTasks = await ctx.prisma.task.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "completed"
          },
        });

        stats.tasks = {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks,
        };
      }

      // Leads stats
      if (hasPermission(PERMISSION_TREE_V2.leads.view)) {
        const totalLeads = await ctx.prisma.lead.count({
          where: { tenantId: ctx.tenantId },
        });

        const newLeads = await ctx.prisma.lead.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "new"
          },
        });

        const convertedLeads = await ctx.prisma.lead.count({
          where: { 
            tenantId: ctx.tenantId,
            status: "converted"
          },
        });

        stats.leads = {
          total: totalLeads,
          new: newLeads,
          converted: convertedLeads,
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

  /**
   * Get recent activities for the dashboard
   */
  getRecentActivities: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userPermissions = ctx.session.user.permissions || [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      const hasPermission = (permission: string) => 
        isSuperAdmin || userPermissions.includes(permission);

      // Only fetch if user has audit permission
      if (!hasPermission(PERMISSION_TREE_V2.audit.view)) {
        return [];
      }

      try {
        const activities = await ctx.prisma.auditLog.findMany({
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

        return activities;
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        return [];
      }
    }),

  /**
   * Get upcoming contract expirations
   */
  getUpcomingExpirations: tenantProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userPermissions = ctx.session.user.permissions || [];
      const isSuperAdmin = ctx.session.user.isSuperAdmin;

      const hasPermission = (permission: string) => 
        isSuperAdmin || userPermissions.includes(permission);

      if (!hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all)) {
        return [];
      }

      try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + input.days);

        const expiringContracts = await ctx.prisma.contract.findMany({
          where: {
            tenantId: ctx.tenantId,
            status: "active",
            endDate: {
              gte: today,
              lte: futureDate,
            },
          },
          orderBy: { endDate: "asc" },
          take: 10,
          select: {
            id: true,
            title: true,
            endDate: true,
            contractor: {
              select: {
                name: true,
              },
            },
            agency: {
              select: {
                name: true,
              },
            },
          },
        });

        return expiringContracts;
      } catch (error) {
        console.error("Error fetching upcoming expirations:", error);
        return [];
      }
    }),
});
