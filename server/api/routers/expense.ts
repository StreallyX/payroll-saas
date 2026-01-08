import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc";
import { TRPCError } from "@trpc/server";

import {
  buildPermissionKey,
  Resource,
  Action,
  PermissionScope,
} from "../../rbac/permissions";

export const expenseRouter = createTRPCRouter({

  // ========================================================
  // GET MY EXPENSES (OWN or TENANT)
  // ========================================================
  getMyExpenses: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.GLOBAL),
      ])
    )
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const CAN_READ_OWN = ctx.session.user.permissions.includes(
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN)
      );

      const CAN_READ_TENANT = ctx.session.user.permissions.includes(
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.GLOBAL)
      );

      const where: any = { tenantId: ctx.tenantId };

      // OWN → we only see our expenses
      if (CAN_READ_OWN && !CAN_READ_TENANT) {
        where.submittedBy = userId;
      }

      return ctx.prisma.expense.findMany({
        where,
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          contract: {
            select: {
              id: true,
              contractReference: true,
              title: true,
              participants: {
                include: {
                  user: { select: { name: true } },
                  company: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { expenseDate: "desc" },
      });
    }),

  // ========================================================
  // CREATE EXPENSE (Tenant scope)
  // ========================================================
  createExpense: tenantProcedure
  .use(
    hasAnyPermission([
      buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.OWN),
      buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.GLOBAL),
    ])
  )
  .input(
    z.object({
      contractId: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string(),
      category: z.string(),
      expenseDate: z.string().refine((v) => !isNaN(Date.parse(v)),"Invalid date format"),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.expense.create({
      data: {
        tenantId: ctx.tenantId,
        submittedBy: ctx.session.user.id,
        contractId: input.contractId ?? null,
        title: input.title,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        expenseDate: new Date(input.expenseDate),
        receiptUrl: input.receiptUrl,
        receiptFileName: input.receiptFileName,
        notes: input.notes,
        status: "draft",
      },
    });
  }),

  // ========================================================
  // UPDATE EXPENSE (OWN or TENANT)
  // ========================================================
  updateExpense: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.GLOBAL),
      ])
    )
    .input(
      z.object({
        expenseId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        amount: z.number().optional(),
        category: z.string().optional(),
        expenseDate: z.date().optional(),
        receiptUrl: z.string().optional(),
        receiptFileName: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const CAN_UPDATE_OWN = ctx.session.user.permissions.includes(
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN)
      );

      const where: any = {
        id: input.expenseId,
        tenantId: ctx.tenantId,
      };

      if (CAN_UPDATE_OWN) {
        where.submittedBy = userId;
        where.status = { in: ["draft", "rejected"] };
      }

      const expense = await ctx.prisma.expense.findFirst({ where });

      if (!expense) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot edit this expense",
        });
      }

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: input,
      });
    }),

  // ========================================================
  // DELETE EXPENSE
  // ========================================================
  deleteExpense: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.GLOBAL),
      ])
    )
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const CAN_DELETE_OWN = ctx.session.user.permissions.includes(
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.OWN)
      );

      const where: any = {
        id: input.expenseId,
        tenantId: ctx.tenantId,
      };

      if (CAN_DELETE_OWN) {
        where.submittedBy = userId;
        where.status = "draft";
      }

      const expense = await ctx.prisma.expense.findFirst({ where });

      if (!expense) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete this expense",
        });
      }

      await ctx.prisma.expense.delete({ where: { id: input.expenseId } });

      return { success: true };
    }),

  // ========================================================
  // SUBMIT EXPENSE
  // ========================================================
  submitExpense: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.SUBMIT, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.expenseId,
          tenantId: ctx.tenantId,
        },
      });

      if (!expense) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      if (!["draft", "rejected"].includes(expense.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Expense already submitted",
        });
      }

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: { status: "submitted", submittedAt: new Date() },
      });
    }),

  // ========================================================
  // ADMIN: LIST ALL
  // ========================================================
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.GLOBAL)
      )
    )
    .input(
      z
        .object({
          status: z.string().optional(),
          contractId: z.string().optional(),
          category: z.string().optional(),
          submittedBy: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: input?.status,
          contractId: input?.contractId,
          submittedBy: input?.submittedBy,
          category: input?.category,
          OR: input?.search
            ? [
                { title: { contains: input.search, mode: "insensitive" } },
                { description: { contains: input.search, mode: "insensitive" } },
                {
                  submitter: {
                    name: { contains: input.search, mode: "insensitive" },
                  },
                },
              ]
            : undefined,
        },
        include: {
          submitter: true,
          contract: true,
        },
        orderBy: { expenseDate: "desc" },
      });
    }),

  // ========================================================
  // ADMIN: STATS
  // ========================================================
  getStatistics: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.GLOBAL)
      )
    )
    .query(async ({ ctx }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: { tenantId: ctx.tenantId },
      });

      return {
        totalAmount: expenses.reduce((s, e) => s + Number(e.amount), 0),
        submitted: expenses.filter((e) => e.status === "submitted").length,
        approved: expenses.filter((e) => e.status === "approved").length,
        paid: expenses.filter((e) => e.status === "paid").length,
      };
    }),

  // ========================================================
  // ADMIN: APPROVE
  // ========================================================
  approve: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.session.user.id,
        },
      });
    }),

  // ========================================================
  // ADMIN: REJECT
  // ========================================================
  reject: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.REJECT, PermissionScope.GLOBAL)
      )
    )
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectionReason: input.reason ?? null,
        },
      });
    }),

  // ========================================================
  // ADMIN: MARK AS PAID
  // ========================================================
  markPaid: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.PAY, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      });
    }),
});
