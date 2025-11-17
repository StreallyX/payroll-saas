
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { hasPermission } from "../trpc"
import { PERMISSION_TREE } from "../../rbac/permissions"
import { TRPCError } from "@trpc/server"

export const expenseRouter = createTRPCRouter({
  
  // Get contractor's own expenses
  getMyExpenses: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      return ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        },
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } }
            }
          }
        },
        orderBy: { expenseDate: 'desc' }
      })
    }),
  
  // Create expense claim
  createExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.create))
    .input(z.object({
      contractId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      category: z.string(), // travel, meals, equipment, software, etc.
      expenseDate: z.date(),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify contractor owns contract
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          contractorId: user.contractor.id,
          tenantId: ctx.tenantId
        }
      })
      
      if (!contract) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Contract not found or not owned by you" 
        })
      }
      
      // Create expense
      const expense = await ctx.prisma.expense.create({
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
          status: 'draft',
        }
      })
      
      return expense
    }),
  
  // Update expense
  updateExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.update))
    .input(z.object({
      expenseId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      amount: z.number().positive().optional(),
      category: z.string().optional(),
      expenseDate: z.date().optional(),
      receiptUrl: z.string().optional(),
      receiptFileName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { expenseId, ...updates } = input
      
      // Verify ownership
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: expenseId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId,
          status: { in: ['draft', 'rejected'] } // Can only update draft or rejected
        }
      })
      
      if (!expense) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Expense not found or cannot be updated" 
        })
      }
      
      // Update expense
      const updated = await ctx.prisma.expense.update({
        where: { id: expenseId },
        data: updates
      })
      
      return updated
    }),
  
  // Delete expense
  deleteExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.delete))
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
          status: 'draft' // Can only delete drafts
        }
      })
      
      if (!expense) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Expense not found or cannot be deleted" 
        })
      }
      
      await ctx.prisma.expense.delete({
        where: { id: input.expenseId }
      })
      
      return { success: true }
    }),
  
  // Submit expense for approval
  submitExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.submit))
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
          tenantId: ctx.tenantId
        },
        include: {
          contract: {
            include: { agency: true }
          }
        }
      })
      
      if (!expense) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" })
      }
      
      if (expense.status !== 'draft' && expense.status !== 'rejected') {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Expense already submitted" 
        })
      }
      
      // Update status
      const updated = await ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: {
          status: 'submitted',
          submittedAt: new Date()
        }
      })
      
      // TODO: Send notification to approver
      // await sendExpenseNotification(expense, user.contractor)
      
      return updated
    }),
  
  // Get expense summary stats
  getMyExpenseSummary: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.expense.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })
      }
      
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        }
      })
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay())
      thisWeek.setHours(0, 0, 0, 0)
      
      return {
        total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        thisWeek: expenses
          .filter(e => e.expenseDate >= thisWeek)
          .reduce((sum, e) => sum + Number(e.amount), 0),
        thisMonth: expenses
          .filter(e => e.expenseDate >= thisMonth)
          .reduce((sum, e) => sum + Number(e.amount), 0),
        pending: expenses
          .filter(e => e.status === 'submitted')
          .reduce((sum, e) => sum + Number(e.amount), 0),
        approved: expenses
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + Number(e.amount), 0),
      }
    }),
})
