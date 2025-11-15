
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
 * Expense Router - Phase 2
 * 
 * Handles expense management including:
 * - Expense submission by contractors
 * - Approval workflows
 * - Payment tracking
 */

export const expenseRouter = createTRPCRouter({
  
  // ---------------------------------------------------------
  // GET ALL EXPENSES
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({
      status: z.enum(["draft", "submitted", "approved", "rejected", "paid"]).optional(),
      contractorId: z.string().optional(),
      contractId: z.string().optional(),
      category: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.ExpenseWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.contractorId) {
        where.contractorId = input.contractorId;
      }

      if (input?.contractId) {
        where.contractId = input.contractId;
      }

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.startDate || input?.endDate) {
        where.expenseDate = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [expenses, total] = await Promise.all([
        ctx.prisma.expense.findMany({
          where,
          include: {
            contractor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            contract: {
              select: {
                id: true,
                title: true,
              },
            },
            approvalWorkflow: {
              include: {
                steps: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.expense.count({ where }),
      ]);

      return {
        expenses,
        total,
        hasMore: (input?.offset ?? 0) + expenses.length < total,
      };
    }),

  // ---------------------------------------------------------
  // GET EXPENSE BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contractor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          contract: true,
          approvalWorkflow: {
            include: {
              steps: true,
            },
          },
          payments: true,
        },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      return expense;
    }),

  // ---------------------------------------------------------
  // CREATE EXPENSE
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      contractorId: z.string().optional(),
      contractId: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      category: z.string(),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      expenseDate: z.date(),
      notes: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          submittedById: ctx.session.user.id,
          status: "draft",
        },
        include: {
          contractor: true,
          contract: true,
        },
      });

      return expense;
    }),

  // ---------------------------------------------------------
  // UPDATE EXPENSE
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().positive().optional(),
      category: z.string().optional(),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      expenseDate: z.date().optional(),
      notes: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const expense = await ctx.prisma.expense.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      if (expense.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft expenses can be edited",
        });
      }

      const updated = await ctx.prisma.expense.update({
        where: { id },
        data,
        include: {
          contractor: true,
          contract: true,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // DELETE EXPENSE
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      if (expense.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft expenses can be deleted",
        });
      }

      await ctx.prisma.expense.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // SUBMIT EXPENSE FOR APPROVAL
  // ---------------------------------------------------------
  submit: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      if (expense.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft expenses can be submitted",
        });
      }

      // Create approval workflow
      const workflow = await ctx.prisma.approvalWorkflow.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: "expense",
          entityId: expense.id,
          workflowType: "single_approver",
          status: "pending",
          createdById: ctx.session.user.id,
        },
      });

      // Update expense status
      const updated = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "submitted",
          submittedAt: new Date(),
          approvalWorkflowId: workflow.id,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // APPROVE EXPENSE
  // ---------------------------------------------------------
  approve: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      if (expense.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted expenses can be approved",
        });
      }

      // Update approval workflow if exists
      if (expense.approvalWorkflowId) {
        await ctx.prisma.approvalWorkflow.update({
          where: { id: expense.approvalWorkflowId },
          data: {
            status: "approved",
            finalDecision: "approved",
            finalDecisionAt: new Date(),
            finalDecisionBy: ctx.session.user.id,
            completedAt: new Date(),
          },
        });
      }

      // Update expense status
      const updated = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "approved",
          approvedById: ctx.session.user.id,
          approvedAt: new Date(),
          notes: input.notes,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // REJECT EXPENSE
  // ---------------------------------------------------------
  reject: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      if (expense.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted expenses can be rejected",
        });
      }

      // Update approval workflow if exists
      if (expense.approvalWorkflowId) {
        await ctx.prisma.approvalWorkflow.update({
          where: { id: expense.approvalWorkflowId },
          data: {
            status: "rejected",
            finalDecision: "rejected",
            finalDecisionAt: new Date(),
            finalDecisionBy: ctx.session.user.id,
            completedAt: new Date(),
          },
        });
      }

      // Update expense status
      const updated = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectionReason: input.reason,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // GET EXPENSES BY CONTRACTOR
  // ---------------------------------------------------------
  getByContractor: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          contractorId: input.contractorId,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: true,
          payments: true,
        },
        orderBy: { expenseDate: "desc" },
      });

      return expenses;
    }),

  // ---------------------------------------------------------
  // GET EXPENSE STATISTICS
  // ---------------------------------------------------------
  getStatistics: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.ExpenseWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.startDate || input?.endDate) {
        where.expenseDate = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [
        totalExpenses,
        submittedExpenses,
        approvedExpenses,
        rejectedExpenses,
        paidExpenses,
        totalAmount,
        paidAmount,
      ] = await Promise.all([
        ctx.prisma.expense.count({ where }),
        ctx.prisma.expense.count({ where: { ...where, status: "submitted" } }),
        ctx.prisma.expense.count({ where: { ...where, status: "approved" } }),
        ctx.prisma.expense.count({ where: { ...where, status: "rejected" } }),
        ctx.prisma.expense.count({ where: { ...where, status: "paid" } }),
        ctx.prisma.expense.aggregate({
          where,
          _sum: { amount: true },
        }),
        ctx.prisma.expense.aggregate({
          where: { ...where, status: "paid" },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalExpenses,
        submittedExpenses,
        approvedExpenses,
        rejectedExpenses,
        paidExpenses,
        totalAmount: totalAmount._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
      };
    }),
});
