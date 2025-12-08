import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"

import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { StateTransitionService } from "@/lib/services/StateTransitionService"
import { MarginCalculationService, MarginPaidBy } from "@/lib/services/MarginCalculationService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"

const P = {
  READ_OWN: "invoice.read.own",
  CREATE_OWN: "invoice.create.own",
  UPDATE_OWN: "invoice.update.own",

  LIST_GLOBAL: "invoice.list.global",
  CREATE_GLOBAL: "invoice.create.global",
  UPDATE_GLOBAL: "invoice.update.global",
  DELETE_GLOBAL: "invoice.delete.global",
  SEND_GLOBAL: "invoice.send.global",
  APPROVE_GLOBAL: "invoice.approve.global",
  PAY_GLOBAL: "invoice.pay.global",
  EXPORT_GLOBAL: "invoice.export.global",
  REVIEW_GLOBAL: "invoice.review.global",
  REJECT_GLOBAL: "invoice.reject.global",
  MODIFY_GLOBAL: "invoice.modify.global",
}

export const invoiceRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // 1️⃣ LIST ALL (GLOBAL ONLY)
  // ---------------------------------------------------------
  getAll: tenantProcedure
  .use(hasAnyPermission([P.LIST_GLOBAL, P.READ_OWN]))
  .input(
    z.object({
      status: z.string().optional(),
      contractId: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    const user = ctx.session.user;
    const tenantId = ctx.tenantId;

    const isGlobal = user.permissions.includes(P.LIST_GLOBAL);

    // BASE QUERY
    const where: any = { tenantId };

    // FILTER: admin can filter any contract ; own-user only its own
    if (input?.status) where.status = input.status;
    if (input?.contractId) where.contractId = input.contractId;

    // OWN → LIMIT to createdBy
    if (!isGlobal) {
      where.createdBy = user.id;
    }

    const [invoices, total] = await Promise.all([
      ctx.prisma.invoice.findMany({
        where,
        include: { 
          lineItems: true, 
          contract: {
            include: {
              participants: {
                include: {
                  user: true,
                  company: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: input?.offset,
        take: input?.limit,
      }),
      ctx.prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }),

  // ---------------------------------------------------------
  // 2️⃣ LIST MY OWN INVOICES (OWN)
  // ---------------------------------------------------------
  getMyInvoices: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          createdBy: ctx.session.user.id,
        },
        include: { 
          lineItems: true, 
          contract: {
            include: {
              participants: {
                include: {
                  user: true,
                  company: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // 2️⃣.1 LIST AGENCY INVOICES (OWN)
  // Pour les agences : voir les invoices des contrats où elles sont participantes
  // ---------------------------------------------------------
  getMyAgencyInvoices: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      // Trouver tous les contrats où l'utilisateur est une agence
      const agencyContracts = await ctx.prisma.contractParticipant.findMany({
        where: {
          userId: ctx.session.user.id,
          role: "AGENCY",
          isActive: true,
        },
        select: { contractId: true },
      })

      const contractIds = agencyContracts.map(c => c.contractId)

      // Récupérer les invoices de ces contrats
      return ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractId: { in: contractIds },
        },
        include: {
          lineItems: true,
          contract: {
            include: {
              participants: {
                where: { role: "CONTRACTOR" },
                include: { user: { select: { name: true, email: true } } }
              }
            }
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // 3️⃣ GET ONE (OWN OR GLOBAL)
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.READ_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { 
          lineItems: true, 
          contract: {
            include: {
              participants: {
                include: {
                  user: true,
                  company: true,
                },
              },
            },
          },
        },
      })

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })

      const isAdmin = ctx.session.user.permissions.includes(P.LIST_GLOBAL)

      if (!isAdmin && invoice.createdBy !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      return invoice
    }),

  // ---------------------------------------------------------
  // 4️⃣ CREATE — OWN OR GLOBAL
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
    .input(
      z.object({
        contractId: z.string().optional(),
        notes: z.string().optional(),
        description: z.string().optional(),
        issueDate: z.date(),
        dueDate: z.date(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.permissions.includes(P.CREATE_GLOBAL)

      // OWN → l'utilisateur doit être participant actif du contrat
      if (!isAdmin && input.contractId) {
        const contract = await ctx.prisma.contract.findFirst({
          where: {
            id: input.contractId,
            tenantId: ctx.tenantId,
            participants: {
              some: {
                userId: ctx.session.user.id,
                isActive: true
              }
            }
          }
        })

        if (!contract) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not part of this contract"
          })
        }
      }


      const amount = new Prisma.Decimal(
        input.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)
      )

      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: input.contractId,
          createdBy: ctx.session.user.id,
          description: input.description,
          notes: input.notes,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          amount,
          taxAmount: new Prisma.Decimal(0),
          totalAmount: amount,
          status: "draft",
          lineItems: {
            create: input.lineItems.map((li) => ({
              description: li.description,
              quantity: new Prisma.Decimal(li.quantity),
              unitPrice: new Prisma.Decimal(li.unitPrice),
              amount: new Prisma.Decimal(li.quantity * li.unitPrice),
            }))
          },
        },
        include: { lineItems: true }
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice created",
      });

      return invoice
    }),

  // ---------------------------------------------------------
  // 5️⃣ UPDATE (OWN OR GLOBAL)
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId }
      })

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })

      const isAdmin = ctx.session.user.permissions.includes(P.UPDATE_GLOBAL)

      if (!isAdmin && invoice.createdBy !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      let totalAmount = invoice.totalAmount

      if (input.lineItems) {
        totalAmount = new Prisma.Decimal(
          input.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0)
        )
      }

      const updated = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: {
          description: input.description,
          notes: input.notes,
          status: input.status,
          totalAmount,

          ...(input.lineItems && {
            lineItems: {
              deleteMany: { invoiceId: input.id },
              create: input.lineItems.map((li) => ({
                description: li.description,
                quantity: new Prisma.Decimal(li.quantity),
                unitPrice: new Prisma.Decimal(li.unitPrice),
                amount: new Prisma.Decimal(li.quantity * li.unitPrice),
              }))
            }
          })
        }
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice updated",
      });

      return updated
    }),

  // ---------------------------------------------------------
  // 6️⃣ DELETE (GLOBAL ONLY)
  // ---------------------------------------------------------
  deleteInvoice: tenantProcedure
    .use(hasPermission(P.DELETE_GLOBAL))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      
      // fetch invoice BEFORE delete
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId }
      })

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })

      await ctx.prisma.invoice.delete({
        where: { id: input.id }
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice deleted",
      });

      return { success: true }
    }),

  // ---------------------------------------------------------
  // 7️⃣ MARK AS PAID (AGENCY)
  // Permet à l'agence de marquer une invoice comme payée
  // Crée automatiquement un Payment avec status "pending"
  // ---------------------------------------------------------
  markAsPaid: tenantProcedure
    .use(hasAnyPermission([P.PAY_GLOBAL, "invoice.pay.own"]))
    .input(
      z.object({
        id: z.string(),
        paymentMethod: z.string().default("bank_transfer"),
        transactionId: z.string().optional(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Récupérer l'invoice avec le contrat et les participants
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              participants: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" })

      // 2. Vérifier les permissions (si pas admin, vérifier que l'utilisateur est l'agence du contrat)
      const isAdmin = ctx.session.user.permissions.includes(P.PAY_GLOBAL)
      
      if (!isAdmin) {
        // Vérifier que l'utilisateur est une agence participant au contrat
        const isAgency = invoice.contract?.participants.some(
          p => p.userId === ctx.session.user.id && p.role === "AGENCY"
        )

        if (!isAgency) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the agency associated with this contract can mark this invoice as paid"
          })
        }
      }

      // 3. Vérifier que l'invoice n'est pas déjà payée
      if (invoice.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is already marked as paid"
        })
      }

      // 4. Créer un Payment avec status "pending" (sera confirmé par l'admin)
      const payment = await ctx.prisma.payment.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          currency: invoice.currency,
          status: "pending", // En attente de confirmation par l'admin
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId,
          referenceNumber: input.referenceNumber,
          scheduledDate: new Date(),
          description: `Payment for invoice ${invoice.invoiceNumber ?? invoice.id}`,
          notes: input.notes,
          createdBy: ctx.session.user.id,
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            contractId: invoice.contractId,
            markedByAgency: true,
          }
        },
      })

      // 5. Mettre à jour l'invoice status à "paid"
      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: {
          status: "paid",
          paidDate: new Date(),
        },
        include: {
          lineItems: true,
          contract: true,
          payments: true,
        }
      })

      // 6. Créer un audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice marked as paid by agency",
        metadata: {
          paymentId: payment.id,
          transactionId: input.transactionId,
        }
      });

      return {
        invoice: updatedInvoice,
        payment,
      }
    }),

  // ========================================================
  // 🔥 NEW WORKFLOW METHODS
  // ========================================================

  /**
   * Mark invoice as under review
   */
  reviewInvoice: tenantProcedure
    .use(hasPermission(P.REVIEW_GLOBAL))
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.id,
        action: WorkflowAction.REVIEW,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Approve invoice (using workflow)
   */
  approveInvoiceWorkflow: tenantProcedure
    .use(hasPermission(P.APPROVE_GLOBAL))
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.id,
        action: WorkflowAction.APPROVE,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Reject invoice
   */
  rejectInvoiceWorkflow: tenantProcedure
    .use(hasPermission(P.REJECT_GLOBAL))
    .input(z.object({
      id: z.string(),
      rejectionReason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.id,
        action: WorkflowAction.REJECT,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.rejectionReason,
        metadata: {
          rejectionReason: input.rejectionReason,
        },
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Request changes to invoice
   */
  requestInvoiceChanges: tenantProcedure
    .use(hasPermission(P.REVIEW_GLOBAL))
    .input(z.object({
      id: z.string(),
      changesRequested: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.id,
        action: WorkflowAction.REQUEST_CHANGES,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.changesRequested,
        metadata: {
          changesRequested: input.changesRequested,
        },
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Send approved invoice
   */
  sendInvoiceWorkflow: tenantProcedure
    .use(hasPermission(P.SEND_GLOBAL))
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.id,
        action: WorkflowAction.SEND,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Calculate margin for invoice
   */
  calculateMargin: tenantProcedure
    .use(hasPermission(P.MODIFY_GLOBAL))
    .input(z.object({
      id: z.string(),
      contractId: z.string().optional(),
      baseAmount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      let calculation

      if (input.contractId) {
        calculation = await MarginCalculationService.calculateMarginFromContract(
          input.contractId,
          input.baseAmount
        )
      } else {
        // Use default margin calculation
        calculation = MarginCalculationService.calculateMargin({
          baseAmount: input.baseAmount,
          marginPaidBy: MarginPaidBy.CLIENT,
        })
      }

      if (!calculation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not calculate margin",
        })
      }

      // Update invoice with calculated margin
      await MarginCalculationService.applyMarginToInvoice(input.id, calculation)

      return calculation
    }),

  /**
   * Modify invoice amounts and margins (admin only, before approval)
   */
  modifyInvoiceAmounts: tenantProcedure
    .use(hasPermission(P.MODIFY_GLOBAL))
    .input(z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      marginAmount: z.number().optional(),
      marginPercentage: z.number().optional(),
      adminModificationNote: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      // Only allow modification in draft, submitted, or under_review states
      if (!['draft', 'submitted', 'under_review'].includes(invoice.workflowState)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only modify amounts in draft, submitted, or under_review state",
        })
      }

      const updateData: any = {
        adminModificationNote: input.adminModificationNote,
        modifiedBy: ctx.session.user.id,
        updatedAt: new Date(),
      }

      if (input.amount) {
        updateData.adminModifiedAmount = new Prisma.Decimal(input.amount)
        updateData.amount = new Prisma.Decimal(input.amount)
      }

      if (input.marginAmount !== undefined) {
        updateData.marginAmount = new Prisma.Decimal(input.marginAmount)
      }

      if (input.marginPercentage !== undefined) {
        updateData.marginPercentage = new Prisma.Decimal(input.marginPercentage)
      }

      return ctx.prisma.invoice.update({
        where: { id: input.id },
        data: updateData,
      })
    }),

  /**
   * Get available workflow actions for an invoice
   */
  getInvoiceAvailableActions: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      const isOwner = invoice.createdBy === ctx.session.user.id

      const result = await StateTransitionService.getAvailableActions(
        WorkflowEntityType.INVOICE,
        input.id,
        ctx.session.user.id,
        ctx.tenantId
      )

      return {
        ...result,
        isOwner,
      }
    }),

  /**
   * Get workflow state history for an invoice
   */
  getInvoiceStateHistory: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return StateTransitionService.getStateHistory(
        WorkflowEntityType.INVOICE,
        input.id,
        ctx.tenantId
      )
    }),

})
