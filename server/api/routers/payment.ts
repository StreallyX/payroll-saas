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
 * Payment Router - Phase 2
 * 
 * Handles all payment operations including:
 * - Payment processing for invoices and expenses
 * - Payment tracking and status management
 * - Payment refunds and failure handling
 */

export const paymentRouter = createTRPCRouter({
  
  // ---------------------------------------------------------
  // GET ALL PAYMENTS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({
      status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
      invoiceId: z.string().optional(),
      expenseId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.PaymentWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.invoiceId) {
        where.invoiceId = input.invoiceId;
      }

      if (input?.expenseId) {
        where.expenseId = input.expenseId;
      }

      if (input?.startDate || input?.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where,
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                amount: true,
              },
            },
            expense: {
              select: {
                id: true,
                title: true,
                amount: true,
              },
            },
            paymentMethodRel: {
              select: {
                id: true,
                type: true,
                bankName: true,
                cardLast4: true,
                cardBrand: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.payment.count({ where }),
      ]);

      return {
        payments,
        total,
        hasMore: (input?.offset ?? 0) + payments.length < total,
      };
    }),

  // ---------------------------------------------------------
  // GET PAYMENT BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          invoice: true,
          expense: true,
          paymentMethodRel: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      return payment;
    }),

  // ---------------------------------------------------------
  // CREATE PAYMENT
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.manage))
    .input(z.object({
      invoiceId: z.string().optional(),
      expenseId: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      paymentMethod: z.string(),
      paymentMethodId: z.string().optional(),
      transactionId: z.string().optional(),
      referenceNumber: z.string().optional(),
      scheduledDate: z.date().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate that either invoiceId or expenseId is provided
      if (!input.invoiceId && !input.expenseId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either invoiceId or expenseId must be provided",
        });
      }

      // Create the payment
      const payment = await ctx.prisma.payment.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceId: input.invoiceId,
          expenseId: input.expenseId,
          amount: input.amount,
          currency: input.currency,
          status: input.scheduledDate ? "pending" : "processing",
          paymentMethod: input.paymentMethod,
          paymentMethodId: input.paymentMethodId,
          transactionId: input.transactionId,
          referenceNumber: input.referenceNumber,
          scheduledDate: input.scheduledDate,
          description: input.description,
          notes: input.notes,
          metadata: input.metadata,
          createdById: ctx.session.user.id,
        },
        include: {
          invoice: true,
          expense: true,
        },
      });

      return payment;
    }),

  // ---------------------------------------------------------
  // UPDATE PAYMENT
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.manage))
    .input(z.object({
      id: z.string(),
      status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
      transactionId: z.string().optional(),
      processedDate: z.date().optional(),
      completedDate: z.date().optional(),
      failureReason: z.string().optional(),
      notes: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const payment = await ctx.prisma.payment.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      const updated = await ctx.prisma.payment.update({
        where: { id },
        data: {
          ...data,
          ...(input.status === "completed" && !input.completedDate && { completedDate: new Date() }),
        },
        include: {
          invoice: true,
          expense: true,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // DELETE PAYMENT
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.manage))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a completed payment",
        });
      }

      await ctx.prisma.payment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // PROCESS PAYMENT
  // ---------------------------------------------------------
  process: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.manage))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending payments can be processed",
        });
      }

      // Update payment status to processing
      // In a real implementation, this would integrate with a payment gateway
      const updated = await ctx.prisma.payment.update({
        where: { id: input.id },
        data: {
          status: "processing",
          processedDate: new Date(),
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // REFUND PAYMENT
  // ---------------------------------------------------------
  refund: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.manage))
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only completed payments can be refunded",
        });
      }

      const updated = await ctx.prisma.payment.update({
        where: { id: input.id },
        data: {
          status: "refunded",
          notes: payment.notes ? `${payment.notes}\n\nRefund reason: ${input.reason}` : `Refund reason: ${input.reason}`,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // GET PAYMENTS BY INVOICE
  // ---------------------------------------------------------
  getByInvoice: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payments = await ctx.prisma.payment.findMany({
        where: {
          invoiceId: input.invoiceId,
          tenantId: ctx.tenantId,
        },
        orderBy: { createdAt: "desc" },
      });

      return payments;
    }),

  // ---------------------------------------------------------
  // GET PAYMENTS BY EXPENSE
  // ---------------------------------------------------------
  getByExpense: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ expenseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payments = await ctx.prisma.payment.findMany({
        where: {
          expenseId: input.expenseId,
          tenantId: ctx.tenantId,
        },
        orderBy: { createdAt: "desc" },
      });

      return payments;
    }),

  // ---------------------------------------------------------
  // GET PAYMENT STATISTICS
  // ---------------------------------------------------------
  getStatistics: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.PaymentWhereInput = {
        tenantId: ctx.tenantId,
      };

      if (input?.startDate || input?.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalAmount,
      ] = await Promise.all([
        ctx.prisma.payment.count({ where }),
        ctx.prisma.payment.count({ where: { ...where, status: "completed" } }),
        ctx.prisma.payment.count({ where: { ...where, status: "pending" } }),
        ctx.prisma.payment.count({ where: { ...where, status: "failed" } }),
        ctx.prisma.payment.aggregate({
          where: { ...where, status: "completed" },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalAmount: totalAmount._sum.amount || 0,
      };
    }),
});
