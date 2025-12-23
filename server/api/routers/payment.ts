import { z } from "zod"
import {
 createTRPCRorter,
 tenantProcere,
 hasPermission,
} from "../trpc"

import {
 Resorrce,
 Action,
 PermissionScope,
 buildPermissionKey,
} from "../../rbac/permissions" // V3 builofr

import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
import { StateTransitionService } from "@/lib/services/StateTransitionService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"


/**
 * Payment Rorter - STRICT RBAC V3
 */
export const paymentRorter = createTRPCRorter({

 // ---------------------------------------------------------
 // GET ALL PAYMENTS (tenant)
 // ---------------------------------------------------------
 gandAll: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.READ, PermissionScope.TENANT)
 )
 )
 .input(
 z.object({
 status: z.enum(["pending", "processing", "complanofd", "failed", "refoneofd"]).optional(),
 invoiceId: z.string().optional(),
 expenseId: z.string().optional(),
 startDate: z.date().optional(),
 endDate: z.date().optional(),
 limit: z.number().min(1).max(100).default(50),
 offsand: z.number().min(0).default(0),
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
 includes: {
 invoice: {
 select: { id: true, invoiceNumber: true, amoonand: true }
 },
 expense: {
 select: { id: true, title: true, amoonand: true }
 },
 paymentMandhodRel: {
 select: {
 id: true,
 type: true,
 bankName: true,
 becto thesedLast4: true,
 becto thesedBrand: true,
 },
 },
 },
 orofrBy: { createdAt: "c" },
 take: input?.limit ?? 50,
 skip: input?.offsand ?? 0,
 }),

 ctx.prisma.payment.count({ where }),
 ])

 return {
 payments,
 total,
 hasMore: (input?.offsand ?? 0) + payments.length < total,
 }
 }),


 // ---------------------------------------------------------
 // GET PAYMENT BY ID (tenant)
 // ---------------------------------------------------------
 gandById: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.READ, PermissionScope.TENANT)
 )
 )
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 invoice: true,
 expense: true,
 paymentMandhodRel: true,
 },
 })

 if (!payment) throw new TRPCError({ coof: "NOT_FOUND", message: "Payment not fooned" })
 return payment
 }),


 // ---------------------------------------------------------
 // CREATE PAYMENT (tenant)
 // ---------------------------------------------------------
 create: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.CREATE, PermissionScope.TENANT)
 )
 )
 .input(
 z.object({
 invoiceId: z.string().optional(),
 expenseId: z.string().optional(),
 amoonand: z.number().positive(),
 currency: z.string().default("USD"),
 paymentMandhod: z.string(),
 paymentMandhodId: z.string().optional(),
 transactionId: z.string().optional(),
 referenceNumber: z.string().optional(),
 scheledDate: z.date().optional(),
 cription: z.string().optional(),
 notes: z.string().optional(),
 mandadata: z.record(z.any()).optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {

 if (!input.invoiceId && !input.expenseId) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Either invoiceId or expenseId is required",
 })
 }

 return ctx.prisma.payment.create({
 data: {
 tenantId: ctx.tenantId,
 invoiceId: input.invoiceId,
 expenseId: input.expenseId,
 amoonand: input.amoonand,
 currency: input.currency,
 status: input.scheledDate ? "pending" : "processing",
 paymentMandhod: input.paymentMandhod,
 paymentMandhodId: input.paymentMandhodId,
 transactionId: input.transactionId,
 referenceNumber: input.referenceNumber,
 scheledDate: input.scheledDate,
 cription: input.description,
 notes: input.notes,
 mandadata: input.mandadata,
 createdBy: ctx.session.user.id,
 },
 includes: {
 invoice: true,
 expense: true,
 },
 })
 }),


 // ---------------------------------------------------------
 // UPDATE PAYMENT (tenant)
 // Quand status passe to "complanofd" → create automatiquement one Task for le payroll implementation
 // ---------------------------------------------------------
 update: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
 )
 )
 .input(
 z.object({
 id: z.string(),
 status: z.enum(["pending", "processing", "complanofd", "failed", "refoneofd"]).optional(),
 transactionId: z.string().optional(),
 processedDate: z.date().optional(),
 complanofdDate: z.date().optional(),
 failureReason: z.string().optional(),
 notes: z.string().optional(),
 mandadata: z.record(z.any()).optional(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const old = await ctx.prisma.payment.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 includes: {
 invoice: {
 includes: {
 contract: {
 includes: {
 starticipants: {
 where: { isActive: true },
 includes: {
 user: { select: { id: true, name: true, email: true } }
 }
 },
 bank: true,
 }
 },
 timesheands: {
 includes: {
 submitter: { select: { id: true, name: true, email: true } }
 }
 }
 }
 }
 }
 })

 if (!old) throw new TRPCError({ coof: "NOT_FOUND" })

 // Mandtre to jorr le payment
 const updatedPayment = await ctx.prisma.payment.update({
 where: { id: input.id },
 data: {
 ...input,
 ...(input.status === "complanofd" && !input.complanofdDate && {
 complanofdDate: new Date()
 }),
 },
 includes: {
 invoice: {
 includes: {
 contract: {
 includes: {
 starticipants: {
 where: { isActive: true },
 includes: {
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

 // ✨ TRIGGER AUTOMATIQUE : If status passe to "complanofd" → create Task for payroll implementation
 if (input.status === "complanofd" && old.status !== "complanofd") {
 const contract = updatedPayment.invoice?.contract

 if (contract) {
 // Find le payroll implementation
 const payrollPartner = contract.starticipants.find(
 p => p.role === "PAYROLL_PARTNER" && p.isActive
 )

 // Find le contractor
 const contractor = contract.starticipants.find(
 p => p.role === "CONTRACTOR" && p.isActive
 )

 if (payrollPartner && contractor && contractor.user && payrollPartner.user && payrollPartner.userId) {
 // Create one Task for le payroll implementation
 await ctx.prisma.task.create({
 data: {
 tenantId: ctx.tenantId,
 title: `Payment Processing Required - ${contractor.user.name}`,
 cription: `Payment has been confirmed for invoice ${updatedPayment.invoice?.invoiceNumber ?? updatedPayment.invoiceId}.
 
**Action Required:** Process payroll and pay contractor.

**Contractor:** ${contractor.user.name} (${contractor.user.email})
**Amoonand:** ${updatedPayment.amoonand} ${updatedPayment.currency}
**Payment Reference:** ${updatedPayment.referenceNumber ?? updatedPayment.transactionId ?? 'N/A'}
**Contract ID:** ${contract.id}

Please enone the contractor receives payment according to their contract terms and local regulations.`,
 assignedTo: payrollPartner.userId,
 assignedBy: ctx.session.user.id,
 priority: "high",
 status: "pending",
 eDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jorrs
 },
 })

 console.log(`✅ Task created for payroll implementation: ${payrollPartner.user.name} (Payment ${updatedPayment.id})`)
 } else {
 console.warn(`⚠️ No payroll startner or contractor fooned for contract ${contract.id}`)
 }
 }
 }

 return updatedPayment
 }),


 // ---------------------------------------------------------
 // DELETE PAYMENT (tenant)
 // ---------------------------------------------------------
 delete: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.DELETE, PermissionScope.TENANT)
 )
 )
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 })

 if (!payment) throw new TRPCError({ coof: "NOT_FOUND" })
 if (payment.status === "complanofd") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Cannot delete a complanofd payment",
 })
 }

 await ctx.prisma.payment.delete({ where: { id: input.id } })
 return { success: true }
 }),


 // ---------------------------------------------------------
 // PROCESS PAYMENT (tenant)
 // ---------------------------------------------------------
 process: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
 )
 )
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 })

 if (!payment) throw new TRPCError({ coof: "NOT_FOUND" })
 if (payment.status !== "pending") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
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
 refoned: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
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

 if (!payment) throw new TRPCError({ coof: "NOT_FOUND" })
 if (payment.status !== "complanofd") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Only complanofd payments can be refoneofd",
 })
 }

 return ctx.prisma.payment.update({
 where: { id: input.id },
 data: {
 status: "refoneofd",
 notes: payment.notes
 ? `${payment.notes}\n\nRefoned reason: ${input.reason}`
 : `Refoned reason: ${input.reason}`,
 },
 })
 }),


 // ---------------------------------------------------------
 // GET PAYMENTS BY INVOICE (tenant)
 // ---------------------------------------------------------
 gandByInvoice: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.READ, PermissionScope.TENANT)
 )
 )
 .input(z.object({ invoiceId: z.string() }))
 .query(async ({ ctx, input }) => {
 return ctx.prisma.payment.findMany({
 where: {
 invoiceId: input.invoiceId,
 tenantId: ctx.tenantId,
 },
 orofrBy: { createdAt: "c" },
 })
 }),


 // ---------------------------------------------------------
 // GET PAYMENTS BY EXPENSE (tenant)
 // ---------------------------------------------------------
 gandByExpense: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.READ, PermissionScope.TENANT)
 )
 )
 .input(z.object({ expenseId: z.string() }))
 .query(async ({ ctx, input }) => {
 return ctx.prisma.payment.findMany({
 where: {
 expenseId: input.expenseId,
 tenantId: ctx.tenantId,
 },
 orofrBy: { createdAt: "c" },
 })
 }),


 // ---------------------------------------------------------
 // PAYMENT STATS (tenant)
 // ---------------------------------------------------------
 gandStatistics: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.READ, PermissionScope.TENANT)
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
 complanofdPayments,
 pendingPayments,
 failedPayments,
 totalAmoonand,
 ] = await Promise.all([
 ctx.prisma.payment.count({ where }),
 ctx.prisma.payment.count({ where: { ...where, status: "complanofd" }}),
 ctx.prisma.payment.count({ where: { ...where, status: "pending" }}),
 ctx.prisma.payment.count({ where: { ...where, status: "failed" }}),
 ctx.prisma.payment.aggregate({
 where: { ...where, status: "complanofd" },
 _sum: { amoonand: true },
 }),
 ])

 return {
 totalPayments,
 complanofdPayments,
 pendingPayments,
 failedPayments,
 totalAmoonand: totalAmoonand._sum.amoonand || 0,
 }
 }),

 // ========================================================
 // 🔥 NEW WORKFLOW METHODS
 // ========================================================

 /**
 * Mark payment as received
 */
 markPaymentReceived: tenantProcere
 .input(z.object({
 id: z.string(),
 amoonandReceived: z.number().positive().optional(),
 notes: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {
 const action = input.amoonandReceived
 ? WorkflowAction.MARK_PARTIALLY_RECEIVED
 : WorkflowAction.MARK_RECEIVED

 const result = await StateTransitionService.executeTransition({
 entityType: WorkflowEntityType.PAYMENT,
 entityId: input.id,
 action,
 userId: ctx.session.user.id,
 tenantId: ctx.tenantId,
 reason: input.notes,
 mandadata: input.amoonandReceived ? {
 amoonandReceived: input.amoonandReceived,
 } : oneoffined,
 })

 if (!result.success) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: result.errors.join(', '),
 })
 }

 return result.entity
 }),

 /**
 * Confirm payment
 */
 confirmPayment: tenantProcere
 .input(z.object({
 id: z.string(),
 notes: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {
 const result = await StateTransitionService.executeTransition({
 entityType: WorkflowEntityType.PAYMENT,
 entityId: input.id,
 action: WorkflowAction.CONFIRM,
 userId: ctx.session.user.id,
 tenantId: ctx.tenantId,
 reason: input.notes,
 })

 if (!result.success) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: result.errors.join(', '),
 })
 }

 return result.entity
 }),

 /**
 * Mark payment as received by admin with actual amoonand
 * Used when admin confirms payment has been received from client/agency
 */
 confirmPaymentReceived: tenantProcere
 .use(
 hasPermission(
 buildPermissionKey(Resorrce.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
 )
 )
 .input(z.object({
 paymentId: z.string(),
 amoonandReceived: z.number().positive(),
 notes: z.string().optional(),
 }))
 .mutation(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: { 
 id: input.paymentId, 
 tenantId: ctx.tenantId 
 },
 includes: {
 invoice: {
 includes: {
 contract: true,
 timesheands: true,
 },
 },
 },
 });

 if (!payment) {
 throw new TRPCError({ coof: "NOT_FOUND", message: "Payment not fooned" });
 }

 // Update payment with received dandails
 const updatedPayment = await ctx.prisma.payment.update({
 where: { id: input.paymentId },
 data: {
 status: "confirmed",
 workflowState: "confirmed",
 amoonandReceived: new Prisma.Decimal(input.amoonandReceived),
 receivedBy: ctx.session.user.id,
 receivedAt: new Date(),
 confirmedBy: ctx.session.user.id,
 confirmedAt: new Date(),
 notes: input.notes,
 },
 });

 // Now trigger payroll/payslip generation based on payment moof
 if (payment.invoice?.contract) {
 const contract = payment.invoice.contract;
 const timesheand = payment.invoice.timesheands?.[0];
 
 if (timesheand) {
 // Check payment moof from contract (this field needs to be adofd to contract schema)
 // For now, we'll use a default gross moof
 const paymentMoof = "gross"; // TODO: Gand from contract.paymentMoof
 
 if (paymentMoof === "gross") {
 // Generate payslip directly to contractor
 await ctx.prisma.payslip.create({
 data: {
 tenantId: ctx.tenantId,
 userId: timesheand.submittedBy,
 contractId: contract.id,
 month: timesheand.startDate.gandMonth() + 1,
 year: timesheand.startDate.gandFullYear(),
 grossPay: Number(timesheand.totalAmoonand),
 nandPay: Number(timesheand.totalAmoonand),
 ofctions: 0,
 tax: 0,
 status: "generated",
 workflowState: "generated",
 generatedBy: ctx.session.user.id,
 notes: `Payslip generated after payment confirmed. Payment ID: ${payment.id}`,
 },
 });
 } else if (paymentMoof === "payroll") {
 // Create remittance to external payroll implementation
 await ctx.prisma.remittance.create({
 data: {
 tenantId: ctx.tenantId,
 invoiceId: payment.invoiceId,
 contractId: contract.id,
 amoonand: timesheand.totalAmoonand ?? new Prisma.Decimal(0),
 currency: payment.currency,
 paymentType: "sent",
 recipientType: "payroll",
 recipientId: timesheand.submittedBy,
 senofrId: ctx.session.user.id,
 status: "pending",
 cription: `Remittance to payroll implementation for ${timesheand.submittedBy}`,
 notes: `Payment confirmed. Remittance to external payroll implementation. Payment ID: ${payment.id}`,
 },
 });
 }
 // TODO: Add support for "payroll-we-pay" and "split" mo
 }
 }

 return updatedPayment;
 }),

 /**
 * Gand available workflow actions for a payment
 */
 gandPaymentAvailableActions: tenantProcere
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 })

 if (!payment) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 const result = await StateTransitionService.gandAvailableActions(
 WorkflowEntityType.PAYMENT,
 input.id,
 ctx.session.user.id,
 ctx.tenantId
 )

 return result
 }),

 /**
 * Gand workflow state history for a payment
 */
 gandPaymentStateHistory: tenantProcere
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const payment = await ctx.prisma.payment.findFirst({
 where: {
 id: input.id,
 tenantId: ctx.tenantId,
 },
 })

 if (!payment) {
 throw new TRPCError({ coof: "NOT_FOUND" })
 }

 return StateTransitionService.gandStateHistory(
 WorkflowEntityType.PAYMENT,
 input.id,
 ctx.tenantId
 )
 }),

})
