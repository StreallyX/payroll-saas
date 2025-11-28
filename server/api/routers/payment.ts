import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions" // V3 builder

import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"


/**
 * Payment Router - STRICT RBAC V3
 */
export const paymentRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL PAYMENTS (tenant)
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
        invoiceId: z.string().optional(),
        expenseId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.PaymentWhereInput = { tenantId: ctx.tenantId }

      if (input?.status) where.status = input.status
      if (input?.invoiceId) where.invoiceId = input.invoiceId
      if (input?.expenseId) where.expenseId = input.expenseId

      if (input?.startDate || input?.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        }
      }

      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where,
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true, amount: true }
            },
            expense: {
              select: { id: true, title: true, amount: true }
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
      ])

      return {
        payments,
        total,
        hasMore: (input?.offset ?? 0) + payments.length < total,
      }
    }),


  // ---------------------------------------------------------
  // GET PAYMENT BY ID (tenant)
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          invoice: true,
          expense: true,
          paymentMethodRel: true,
        },
      })

      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" })
      return payment
    }),


  // ---------------------------------------------------------
  // CREATE PAYMENT (tenant)
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {

      if (!input.invoiceId && !input.expenseId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either invoiceId or expenseId is required",
        })
      }

      return ctx.prisma.payment.create({
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
          createdBy: ctx.session.user.id,
        },
        include: {
          invoice: true,
          expense: true,
        },
      })
    }),


  // ---------------------------------------------------------
  // UPDATE PAYMENT (tenant)
  // Quand status passe à "completed" → crée automatiquement une Task pour le payroll provider
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
        transactionId: z.string().optional(),
        processedDate: z.date().optional(),
        completedDate: z.date().optional(),
        failureReason: z.string().optional(),
        notes: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          invoice: {
            include: {
              contract: {
                include: {
                  participants: {
                    where: { isActive: true },
                    include: {
                      user: { select: { id: true, name: true, email: true } }
                    }
                  },
                  bank: true,
                }
              },
              timesheets: {
                include: {
                  submitter: { select: { id: true, name: true, email: true } }
                }
              }
            }
          }
        }
      })

      if (!old) throw new TRPCError({ code: "NOT_FOUND" })

      // Mettre à jour le paiement
      const updatedPayment = await ctx.prisma.payment.update({
        where: { id: input.id },
        data: {
          ...input,
          ...(input.status === "completed" && !input.completedDate && {
            completedDate: new Date()
          }),
        },
        include: {
          invoice: {
            include: {
              contract: {
                include: {
                  participants: {
                    where: { isActive: true },
                    include: {
                      user: { select: { id: true, name: true, email: true } }
                    }
                  }
                }
              }
            }
          },
          expense: true
        },
      })

      // ✨ TRIGGER AUTOMATIQUE : Si status passe à "completed" → créer Task pour payroll provider
      if (input.status === "completed" && old.status !== "completed") {
        const contract = updatedPayment.invoice?.contract

        if (contract) {
          // Trouver le payroll provider
          const payrollPartner = contract.participants.find(
            p => p.role === "PAYROLL_PARTNER" && p.isActive
          )

          // Trouver le contractor
          const contractor = contract.participants.find(
            p => p.role === "CONTRACTOR" && p.isActive
          )

          if (payrollPartner && contractor && contractor.user && payrollPartner.user && payrollPartner.userId) {
            // Créer une Task pour le payroll provider
            await ctx.prisma.task.create({
              data: {
                tenantId: ctx.tenantId,
                title: `Payment Processing Required - ${contractor.user.name}`,
                description: `Payment has been confirmed for invoice ${updatedPayment.invoice?.invoiceNumber ?? updatedPayment.invoiceId}.
                
**Action Required:** Process payroll and pay contractor.

**Contractor:** ${contractor.user.name} (${contractor.user.email})
**Amount:** ${updatedPayment.amount} ${updatedPayment.currency}
**Payment Reference:** ${updatedPayment.referenceNumber ?? updatedPayment.transactionId ?? 'N/A'}
**Contract ID:** ${contract.id}

Please ensure the contractor receives payment according to their contract terms and local regulations.`,
                assignedTo: payrollPartner.userId,
                assignedBy: ctx.session.user.id,
                priority: "high",
                status: "pending",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
              },
            })

            console.log(`✅ Task created for payroll provider: ${payrollPartner.user.name} (Payment ${updatedPayment.id})`)
          } else {
            console.warn(`⚠️ No payroll partner or contractor found for contract ${contract.id}`)
          }
        }
      }

      return updatedPayment
    }),


  // ---------------------------------------------------------
  // DELETE PAYMENT (tenant)
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!payment) throw new TRPCError({ code: "NOT_FOUND" })
      if (payment.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a completed payment",
        })
      }

      await ctx.prisma.payment.delete({ where: { id: input.id } })
      return { success: true }
    }),


  // ---------------------------------------------------------
  // PROCESS PAYMENT (tenant)
  // ---------------------------------------------------------
  process: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!payment) throw new TRPCError({ code: "NOT_FOUND" })
      if (payment.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending payments can be processed",
        })
      }

      return ctx.prisma.payment.update({
        where: { id: input.id },
        data: {
          status: "processing",
          processedDate: new Date(),
        },
      })
    }),


  // ---------------------------------------------------------
  // REFUND PAYMENT (tenant)
  // ---------------------------------------------------------
  refund: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!payment) throw new TRPCError({ code: "NOT_FOUND" })
      if (payment.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only completed payments can be refunded",
        })
      }

      return ctx.prisma.payment.update({
        where: { id: input.id },
        data: {
          status: "refunded",
          notes: payment.notes
            ? `${payment.notes}\n\nRefund reason: ${input.reason}`
            : `Refund reason: ${input.reason}`,
        },
      })
    }),


  // ---------------------------------------------------------
  // GET PAYMENTS BY INVOICE (tenant)
  // ---------------------------------------------------------
  getByInvoice: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payment.findMany({
        where: {
          invoiceId: input.invoiceId,
          tenantId: ctx.tenantId,
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // ---------------------------------------------------------
  // GET PAYMENTS BY EXPENSE (tenant)
  // ---------------------------------------------------------
  getByExpense: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ expenseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payment.findMany({
        where: {
          expenseId: input.expenseId,
          tenantId: ctx.tenantId,
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // ---------------------------------------------------------
  // PAYMENT STATS (tenant)
  // ---------------------------------------------------------
  getStatistics: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.PaymentWhereInput = {
        tenantId: ctx.tenantId,
      }

      if (input?.startDate || input?.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        }
      }

      const [
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalAmount,
      ] = await Promise.all([
        ctx.prisma.payment.count({ where }),
        ctx.prisma.payment.count({ where: { ...where, status: "completed" }}),
        ctx.prisma.payment.count({ where: { ...where, status: "pending" }}),
        ctx.prisma.payment.count({ where: { ...where, status: "failed" }}),
        ctx.prisma.payment.aggregate({
          where: { ...where, status: "completed" },
          _sum: { amount: true },
        }),
      ])

      return {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalAmount: totalAmount._sum.amount || 0,
      }
    }),

})
