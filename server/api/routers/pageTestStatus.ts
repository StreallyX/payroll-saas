import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const pageTestStatusRouter = createTRPCRouter({
  // List all page test statuses for a specific role
  list: protectedProcedure
    .input(
      z.object({
        role: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        tenantId: ctx.session.user.tenantId,
      };

      if (input.role) {
        where.pageRole = input.role;
      }

      return await ctx.prisma.pageTestStatus.findMany({
        where,
        orderBy: [
          { pageRole: "asc" },
          { pageName: "asc" },
        ],
      });
    }),

  // Get a specific page test status
  get: protectedProcedure
    .input(
      z.object({
        pageUrl: z.string(),
        pageRole: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.pageTestStatus.findUnique({
        where: {
          tenantId_pageUrl_pageRole: {
            tenantId: ctx.session.user.tenantId,
            pageUrl: input.pageUrl,
            pageRole: input.pageRole,
          },
        },
      });
    }),

  // Update a single page test status
  updateStatus: protectedProcedure
    .input(
      z.object({
        pageUrl: z.string(),
        pageName: z.string(),
        pageRole: z.string(),
        isValidated: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.pageTestStatus.upsert({
        where: {
          tenantId_pageUrl_pageRole: {
            tenantId: ctx.session.user.tenantId,
            pageUrl: input.pageUrl,
            pageRole: input.pageRole,
          },
        },
        update: {
          isValidated: input.isValidated,
          testedBy: input.isValidated ? ctx.session.user.id : null,
          testedAt: input.isValidated ? new Date() : null,
          notes: input.notes,
          updatedAt: new Date(),
        },
        create: {
          tenantId: ctx.session.user.tenantId,
          pageUrl: input.pageUrl,
          pageName: input.pageName,
          pageRole: input.pageRole,
          isValidated: input.isValidated,
          testedBy: input.isValidated ? ctx.session.user.id : null,
          testedAt: input.isValidated ? new Date() : null,
          notes: input.notes,
        },
      });
    }),

  // Bulk update multiple page test statuses
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            pageUrl: z.string(),
            pageName: z.string(),
            pageRole: z.string(),
            isValidated: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const update of input.updates) {
        const result = await ctx.prisma.pageTestStatus.upsert({
          where: {
            tenantId_pageUrl_pageRole: {
              tenantId: ctx.session.user.tenantId,
              pageUrl: update.pageUrl,
              pageRole: update.pageRole,
            },
          },
          update: {
            isValidated: update.isValidated,
            testedBy: update.isValidated ? ctx.session.user.id : null,
            testedAt: update.isValidated ? new Date() : null,
            updatedAt: new Date(),
          },
          create: {
            tenantId: ctx.session.user.tenantId,
            pageUrl: update.pageUrl,
            pageName: update.pageName,
            pageRole: update.pageRole,
            isValidated: update.isValidated,
            testedBy: update.isValidated ? ctx.session.user.id : null,
            testedAt: update.isValidated ? new Date() : null,
          },
        });
        results.push(result);
      }

      return results;
    }),

  // Get statistics for a role
  getStats: protectedProcedure
    .input(
      z.object({
        role: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const statuses = await ctx.prisma.pageTestStatus.findMany({
        where: {
          tenantId: ctx.session.user.tenantId,
          pageRole: input.role,
        },
      });

      const total = statuses.length;
      const validated = statuses.filter((s) => s.isValidated).length;
      const percentage = total > 0 ? Math.round((validated / total) * 100) : 0;

      return {
        total,
        validated,
        pending: total - validated,
        percentage,
      };
    }),

  // Get overall statistics
  getAllStats: protectedProcedure.query(async ({ ctx }) => {
    const statuses = await ctx.prisma.pageTestStatus.findMany({
      where: {
        tenantId: ctx.session.user.tenantId,
      },
    });

    const roles = ["SUPER_ADMIN", "ADMIN", "CONTRACTOR", "AGENCY", "PAYROLL"];
    const stats = roles.map((role) => {
      const roleStatuses = statuses.filter((s) => s.pageRole === role);
      const total = roleStatuses.length;
      const validated = roleStatuses.filter((s) => s.isValidated).length;
      const percentage = total > 0 ? Math.round((validated / total) * 100) : 0;

      return {
        role,
        total,
        validated,
        pending: total - validated,
        percentage,
      };
    });

    return stats;
  }),

  // Delete a page test status
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.pageTestStatus.delete({
        where: { id: input.id },
      });
    }),
});
