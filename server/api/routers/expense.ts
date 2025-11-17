import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { hasPermission } from "../trpc"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"
import { TRPCError } from "@trpc/server"

export const expenseRouter = createTRPCRouter({

  // ================================
  // 🔵 CONTRACTOR — GET OWN EXPENSES
  // ================================
  getMyExpenses: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.view_all))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })

      if (!user?.contractor) throw new TRPCError({ code: "NOT_FOUND", message: "Contractor profile not found" })

      return ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        },
        include: {
          contractor: true,
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } }
            }
          }
        },
        orderBy: { expenseDate: "desc" }
      })
    }),

  // ================================
  // 🔵 CONTRACTOR — CREATE EXPENSE
  // ================================
  createExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.create))
    .input(z.object({
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
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })

      if (!user?.contractor) throw new TRPCError({ code: "NOT_FOUND", message: "Contractor profile not found" })

      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          contractorId: user.contractor.id,
          tenantId: ctx.tenantId
        }
      })

      if (!contract) throw new TRPCError({ code: "FORBIDDEN", message: "Contract not found or not yours" })

      return ctx.prisma.expense.create({
        data: {
          tenantId: ctx.tenantId,
          submittedById: ctx.session.user.id,
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
        }
      })
    }),

  // ================================
  // 🔵 CONTRACTOR — UPDATE EXPENSE
  // ================================
  updateExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.update))
    .input(z.object({
      expenseId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().optional(),
      category: z.string().optional(),
      expenseDate: z.date().optional(),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })

      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.expenseId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId,
          status: { in: ["draft", "rejected"] }
        }
      })

      if (!expense) throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found or not editable" })

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: input
      })
    }),

  deleteExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.delete))
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })

      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.expenseId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId,
          status: "draft"
        }
      })

      if (!expense) throw new TRPCError({ code: "NOT_FOUND", message: "Expense cannot be deleted" })

      await ctx.prisma.expense.delete({ where: { id: input.expenseId } })

      return { success: true }
    }),

  submitExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.submit))
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.expenseId,
          tenantId: ctx.tenantId,
          contractorId: ctx.session.user.contractorId ?? undefined
        }
      })

      if (!expense) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" })

      if (!["draft", "rejected"].includes(expense.status))
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already submitted" })

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: { status: "submitted", submittedAt: new Date() }
      })
    }),

  // ================================
  // 🔴 ADMIN — LIST ALL EXPENSES
  // ================================
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.view_all))
    .input(z.object({
      status: z.string().optional(),
      contractorId: z.string().optional(),
      contractId: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {

      return ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: input?.status,
          contractorId: input?.contractorId,
          contractId: input?.contractId,
          category: input?.category,
          OR: input?.search ? [
            { title: { contains: input.search, mode: "insensitive" }},
            { description: { contains: input.search, mode: "insensitive" }},
            { contractor: { name: { contains: input.search, mode: "insensitive" }}}
          ] : undefined
        },
        include: {
          contractor: true,
          contract: true,
        },
        orderBy: { expenseDate: "desc" }
      })
    }),

  // ================================
  // 🔴 ADMIN — STATISTICS
  // ================================
  getStatistics: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.view_all))
    .query(async ({ ctx }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: { tenantId: ctx.tenantId }
      })

      return {
        totalAmount: expenses.reduce((s, e) => s + Number(e.amount), 0),
        submittedExpenses: expenses.filter(e => e.status === "submitted").length,
        approvedExpenses: expenses.filter(e => e.status === "approved").length,
        paidExpenses: expenses.filter(e => e.status === "paid").length,
      }
    }),

  // ================================
  // 🔴 ADMIN — APPROVE
  // ================================
  approve: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.approve))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: { status: "approved", approvedAt: new Date() }
      })
    }),

  // ================================
  // 🔴 ADMIN — REJECT
  // ================================
  reject: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.reject))
    .input(z.object({
      id: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {

      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectionReason: input.reason ?? null
        }
      })
    }),

  // ================================
  // 🔴 ADMIN — MARK AS PAID
  // ================================
  markPaid: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.expenses.manage.mark_paid))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: "paid",
          paidAt: new Date()
        }
      })
    }),

})
