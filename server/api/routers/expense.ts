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
} from "../../rbac/permissions-v2";

import {
  getPermissionScope,
  buildWhereClause,
  PermissionScope as LegacyScope,
} from "../../../lib/rbac-helpers";

export const expenseRouter = createTRPCRouter({

  // ========================================================
  // GET MY EXPENSES (own OR all)
  // ========================================================
  getMyExpenses: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.TENANT),
      ])
    )
    .query(async ({ ctx }) => {
      // Determine RBAC scope
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.TENANT),
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (scope === LegacyScope.OWN && !user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      const scopeFilter =
        scope === LegacyScope.OWN ? { contractorId: user!.contractor!.id } : {};

      return ctx.prisma.expense.findMany({
        where: buildWhereClause(scope, scopeFilter, { tenantId: ctx.tenantId }),
        include: {
          contractor: true,
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } },
            },
          },
        },
        orderBy: { expenseDate: "desc" },
      });
    }),

  // ========================================================
  // CREATE EXPENSE (contractor only)
  // ========================================================
  createExpense: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        contractId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        category: z.string(),
        expenseDate: z.date(),
        receiptUrl: z.string().optional(),
        receiptFileName: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          contractorId: user.contractor.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Contract not found or not yours",
        });
      }

      return ctx.prisma.expense.create({
        data: {
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
          contractorId: user.contractor.id,
          contractId: input.contractId,
          title: input.title,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          category: input.category,
          expenseDate: input.expenseDate,
          receiptUrl: input.receiptUrl,
          receiptFileName: input.receiptFileName,
          notes: input.notes,
          status: "draft",
        },
      });
    }),

  // ========================================================
  // UPDATE EXPENSE (own OR admin)
  // ========================================================
  updateExpense: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.TENANT),
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
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.TENANT),
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      const whereClause: any = {
        id: input.expenseId,
        tenantId: ctx.tenantId,
      };

      if (scope === LegacyScope.OWN) {
        whereClause.contractorId = user?.contractor?.id;
        whereClause.status = { in: ["draft", "rejected"] };
      }

      const expense = await ctx.prisma.expense.findFirst({ where: whereClause });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found or not editable",
        });
      }

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: input,
      });
    }),

  // ========================================================
  // DELETE EXPENSE (own OR admin)
  // ========================================================
  deleteExpense: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.TENANT),
      ])
    )
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.OWN),
        buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.TENANT),
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      const whereClause: any = {
        id: input.expenseId,
        tenantId: ctx.tenantId,
      };

      if (scope === LegacyScope.OWN) {
        whereClause.contractorId = user?.contractor?.id;
        whereClause.status = "draft";
      }

      const expense = await ctx.prisma.expense.findFirst({
        where: whereClause,
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense cannot be deleted",
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
        buildPermissionKey(Resource.EXPENSE, Action.SUBMIT, PermissionScope.TENANT)
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
          message: "Already submitted",
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
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z
        .object({
          status: z.string().optional(),
          contractorId: z.string().optional(),
          contractId: z.string().optional(),
          category: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: input?.status,
          contractorId: input?.contractorId,
          contractId: input?.contractId,
          category: input?.category,
          OR: input?.search
            ? [
                { title: { contains: input.search, mode: "insensitive" } },
                { description: { contains: input.search, mode: "insensitive" } },
                {
                  contractor: {
                    name: { contains: input.search, mode: "insensitive" },
                  },
                },
              ]
            : undefined,
        },
        include: {
          contractor: true,
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
        buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: { tenantId: ctx.tenantId },
      });

      return {
        totalAmount: expenses.reduce((s, e) => s + Number(e.amount), 0),
        submittedExpenses: expenses.filter((e) => e.status === "submitted").length,
        approvedExpenses: expenses.filter((e) => e.status === "approved").length,
        paidExpenses: expenses.filter((e) => e.status === "paid").length,
      };
    }),

  // ========================================================
  // ADMIN: APPROVE
  // ========================================================
  approve: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: { status: "approved", approvedAt: new Date() },
      });
    }),

  // ========================================================
  // ADMIN: REJECT
  // ========================================================
  reject: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.EXPENSE, Action.REJECT, PermissionScope.TENANT)
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
        buildPermissionKey(Resource.EXPENSE, Action.PAY, PermissionScope.TENANT)
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
