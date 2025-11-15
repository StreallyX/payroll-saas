import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

/**
 * Timesheet Router - Phase 2
 * 
 * Handles timesheet and time entry management
 */
async function calculateTotals(ctx: any, timesheetId: string) {
  const entries = await ctx.prisma.timesheetEntry.findMany({
    where: { timesheetId },
  });

  const totalHours = entries.reduce((sum: number, entry: any) => {
    return sum + Number(entry.hours);
  }, 0);

  const totalAmount = entries.reduce((sum: number, entry: any) => {
    const amount = entry.amount ? Number(entry.amount) : 0;
    return sum + amount;
  }, 0);

  await ctx.prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      totalHours,
      totalAmount: totalAmount > 0 ? totalAmount : null,
    },
  });
}


export const timesheetRouter = createTRPCRouter({
  
  // GET ALL TIMESHEETS
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({
      status: z.enum(["draft", "submitted", "approved", "rejected", "invoiced"]).optional(),
      contractorId: z.string().optional(),
      contractId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.TimesheetWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.status) where.status = input.status;
      if (input?.contractorId) where.contractorId = input.contractorId;
      if (input?.contractId) where.contractId = input.contractId;
      
      if (input?.startDate || input?.endDate) {
        where.startDate = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [timesheets, total] = await Promise.all([
        ctx.prisma.timesheet.findMany({
          where,
          include: {
            contractor: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            contract: {
              select: { id: true, title: true },
            },
            entries: true,
            approvalWorkflow: {
              include: { steps: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.timesheet.count({ where }),
      ]);

      return { timesheets, total, hasMore: (input?.offset ?? 0) + timesheets.length < total };
    }),

  // GET TIMESHEET BY ID
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contractor: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          contract: true,
          entries: {
            orderBy: { date: "asc" },
          },
          approvalWorkflow: {
            include: { steps: true },
          },
          invoice: true,
        },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      return timesheet;
    }),

  // CREATE TIMESHEET
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({
      contractorId: z.string(),
      contractId: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          status: "draft",
          totalHours: 0,
        },
        include: {
          contractor: true,
          contract: true,
        },
      });

      return timesheet;
    }),

  // UPDATE TIMESHEET
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({
      id: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft timesheets can be edited",
        });
      }

      const updated = await ctx.prisma.timesheet.update({
        where: { id },
        data,
        include: {
          contractor: true,
          contract: true,
          entries: true,
        },
      });

      return updated;
    }),

  // DELETE TIMESHEET
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft timesheets can be deleted",
        });
      }

      await ctx.prisma.timesheet.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ADD ENTRY TO TIMESHEET
  addEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({
      timesheetId: z.string(),
      date: z.date(),
      hours: z.number().positive(),
      description: z.string().optional(),
      projectName: z.string().optional(),
      taskName: z.string().optional(),
      rate: z.number().optional(),
      breakHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.timesheetId, tenantId: ctx.tenantId },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only add entries to draft timesheets",
        });
      }

      const amount = input.rate ? input.hours * input.rate : undefined;

      const entry = await ctx.prisma.timesheetEntry.create({
        data: {
          timesheetId: input.timesheetId,
          date: input.date,
          hours: input.hours,
          description: input.description,
          projectName: input.projectName,
          taskName: input.taskName,
          rate: input.rate,
          amount,
          breakHours: input.breakHours,
        },
      });

      // Recalculate timesheet totals
      await calculateTotals(ctx, input.timesheetId);

      return entry;
    }),

  // UPDATE ENTRY
  updateEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({
      id: z.string(),
      hours: z.number().positive().optional(),
      description: z.string().optional(),
      projectName: z.string().optional(),
      taskName: z.string().optional(),
      rate: z.number().optional(),
      breakHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const entry = await ctx.prisma.timesheetEntry.findUnique({
        where: { id },
        include: { timesheet: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet entry not found",
        });
      }

      if (entry.timesheet.tenantId !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      if (entry.timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only edit entries in draft timesheets",
        });
      }

      const amount = input.rate && input.hours ? input.hours * input.rate : entry.amount;

      const updated = await ctx.prisma.timesheetEntry.update({
        where: { id },
        data: { ...data, amount },
      });

      // Recalculate timesheet totals
      await calculateTotals(ctx, entry.timesheetId);

      return updated;
    }),

  // DELETE ENTRY
  deleteEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.timesheetEntry.findUnique({
        where: { id: input.id },
        include: { timesheet: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet entry not found",
        });
      }

      if (entry.timesheet.tenantId !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      if (entry.timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only delete entries from draft timesheets",
        });
      }

      await ctx.prisma.timesheetEntry.delete({
        where: { id: input.id },
      });

      // Recalculate timesheet totals
      await calculateTotals(ctx, entry.timesheetId);

      return { success: true };
    }),

  // SUBMIT TIMESHEET
  submit: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { entries: true },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft timesheets can be submitted",
        });
      }

      if (timesheet.entries.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit timesheet with no entries",
        });
      }

      // Create approval workflow
      const workflow = await ctx.prisma.approvalWorkflow.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: "timesheet",
          entityId: timesheet.id,
          workflowType: "single_approver",
          status: "pending",
          createdById: ctx.session.user.id,
        },
      });

      // Update timesheet status
      const updated = await ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "submitted",
          submittedAt: new Date(),
          approvalWorkflowId: workflow.id,
        },
      });

      return updated;
    }),

  // APPROVE TIMESHEET
  approve: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted timesheets can be approved",
        });
      }

      // Update approval workflow if exists
      if (timesheet.approvalWorkflowId) {
        await ctx.prisma.approvalWorkflow.update({
          where: { id: timesheet.approvalWorkflowId },
          data: {
            status: "approved",
            finalDecision: "approved",
            finalDecisionAt: new Date(),
            finalDecisionBy: ctx.session.user.id,
            completedAt: new Date(),
          },
        });
      }

      // Update timesheet status
      const updated = await ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "approved",
          approvedById: ctx.session.user.id,
          approvedAt: new Date(),
        },
      });

      return updated;
    }),

  // REJECT TIMESHEET
  reject: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted timesheets can be rejected",
        });
      }

      // Update approval workflow if exists
      if (timesheet.approvalWorkflowId) {
        await ctx.prisma.approvalWorkflow.update({
          where: { id: timesheet.approvalWorkflowId },
          data: {
            status: "rejected",
            finalDecision: "rejected",
            finalDecisionAt: new Date(),
            finalDecisionBy: ctx.session.user.id,
            completedAt: new Date(),
          },
        });
      }

      // Update timesheet status
      const updated = await ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectionReason: input.reason,
        },
      });

      return updated;
    }),

  // GET TIMESHEETS BY CONTRACTOR
  getByContractor: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheets = await ctx.prisma.timesheet.findMany({
        where: {
          contractorId: input.contractorId,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: true,
          entries: true,
          invoice: true,
        },
        orderBy: { startDate: "desc" },
      });

      return timesheets;
    }),
});

