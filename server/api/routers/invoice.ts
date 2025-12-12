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
import { MarginService } from "@/lib/services/MarginService"
import { PaymentWorkflowService } from "@/lib/services/PaymentWorkflowService"
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

    // OWN → LIMIT to createdBy OR receiverId (users can see invoices they created or received)
    if (!isGlobal) {
      where.OR = [
        { createdBy: user.id },
        { receiverId: user.id },
      ];
    }

    const [invoices, total] = await Promise.all([
      ctx.prisma.invoice.findMany({
        where,
        include: { 
          lineItems: true,
          margin: isGlobal, // Only include margin for admins
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          OR: [
            { createdBy: ctx.session.user.id },
            { receiverId: ctx.session.user.id }, // 🔥 NEW - Include invoices where user is receiver
          ],
        },
        include: { 
          lineItems: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    const isAdmin = ctx.session.user.permissions.includes(P.LIST_GLOBAL)

    const invoice = await ctx.prisma.invoice.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      include: {
        lineItems: true,
        documents: true, // 🔥 NEW - Include invoice documents
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        // 🔥 NEW — Currency from invoice
        currencyRelation: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
          },
        },

        // 🔥 Only admin sees margin
        margin: isAdmin,

        contract: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                company: {
                  select: {
                    id: true,
                    name: true,
                    contactEmail: true,
                    contactPhone: true,
                    address1: true,
                    address2: true,
                    city: true,
                    state: true,
                    postCode: true,
                    country: true,
                  },
                },
              },
            },

            // 🔥 Contract currency (EXACT matching)
            currency: true,

            // 🔥 NEW: bank details
            bank: true,
          },
        },
      },
    })

    if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })

    // Security: non-admin can only read their own items
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
        senderId: z.string().optional(),
        receiverId: z.string().optional(),
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
          senderId: input.senderId,
          receiverId: input.receiverId,
          description: input.description,
          notes: input.notes,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          amount,
          taxAmount: new Prisma.Decimal(0),
          totalAmount: amount,
          status: "draft",
          workflowState: "draft",
          lineItems: {
            create: input.lineItems.map((li) => ({
              description: li.description,
              quantity: new Prisma.Decimal(li.quantity),
              unitPrice: new Prisma.Decimal(li.unitPrice),
              amount: new Prisma.Decimal(li.quantity * li.unitPrice),
            }))
          },
        },
        include: {
          lineItems: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        }
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
              },
              currency: true
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
          currency: invoice.contract?.currency?.code || "USD",
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

  // ========================================================
  // 🔥 NEW MARGIN & PAYMENT WORKFLOW METHODS
  // ========================================================

  /**
   * Confirm margin for invoice
   * Allows admin to review and optionally override margin before proceeding
   */
  confirmMargin: tenantProcedure
    .use(hasPermission(P.MODIFY_GLOBAL))
    .input(z.object({
      invoiceId: z.string(),
      marginId: z.string().optional(),
      overrideMarginAmount: z.number().optional(),
      overrideMarginPercentage: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: true,
          margin: true,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" })
      }

      // If margin override is requested, apply it
      if (input.marginId && (input.overrideMarginAmount !== undefined || input.overrideMarginPercentage !== undefined)) {
        await MarginService.overrideMargin(input.marginId, {
          newMarginAmount: input.overrideMarginAmount,
          newMarginPercentage: input.overrideMarginPercentage,
          userId: ctx.session.user.id,
          notes: input.notes || 'Admin margin override',
        })
      }

      // Transition invoice to next state
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.invoiceId,
        action: WorkflowAction.CONFIRM_MARGIN,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
        metadata: {
          marginConfirmed: true,
          overridden: !!(input.overrideMarginAmount || input.overrideMarginPercentage),
        },
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.invoiceId,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Margin confirmed for invoice",
        metadata: {
          marginId: input.marginId,
          overridden: !!(input.overrideMarginAmount || input.overrideMarginPercentage),
        },
      })

      return result.entity
    }),

  /**
   * Mark invoice as paid by agency
   * Records when agency marks invoice as paid (first step in payment tracking)
   */
  markAsPaidByAgency: tenantProcedure
    .use(hasAnyPermission([P.PAY_GLOBAL, "invoice.pay.own"]))
    .input(z.object({
      invoiceId: z.string(),
      paymentMethod: z.string().default("bank_transfer"),
      transactionId: z.string().optional(),
      referenceNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: {
            include: {
              participants: true,
            },
          },
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" })
      }

      // Update invoice with agency payment tracking
      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.invoiceId },
        data: {
          agencyMarkedPaidAt: new Date(),
          agencyMarkedPaidBy: ctx.session.user.id,
        },
      })

      // Transition to marked paid by agency state
      await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.invoiceId,
        action: WorkflowAction.MARK_PAID_BY_AGENCY,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
        metadata: {
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId,
          referenceNumber: input.referenceNumber,
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.invoiceId,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice marked as paid by agency",
        metadata: {
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId,
        },
      })

      return updatedInvoice
    }),

  /**
   * Mark payment as received
   * Records when admin confirms payment receipt and triggers payment model workflow
   */
  markPaymentReceived: tenantProcedure
    .use(hasPermission(P.PAY_GLOBAL))
    .input(z.object({
      invoiceId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: true,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" })
      }

      // Update invoice with payment received tracking
      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paymentReceivedAt: new Date(),
          paymentReceivedBy: ctx.session.user.id,
        },
      })

      // Transition to payment received state
      await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.invoiceId,
        action: WorkflowAction.MARK_PAYMENT_RECEIVED,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
      })

      // Execute payment model workflow
      const paymentModel = invoice.paymentModel || invoice.contract?.paymentModel
      if (paymentModel) {
        const workflowResult = await PaymentWorkflowService.executePaymentWorkflow({
          invoiceId: input.invoiceId,
          paymentModel,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          metadata: {
            userName: ctx.session.user.name,
            userRole: ctx.session.user.roleName,
          },
        })

        await createAuditLog({
          userId: ctx.session.user.id,
          userName: ctx.session.user.name!,
          userRole: ctx.session.user.roleName,
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.INVOICE,
          entityId: input.invoiceId,
          entityName: invoice.invoiceNumber ?? "",
          tenantId: ctx.tenantId,
          description: "Payment received and workflow initiated",
          metadata: {
            paymentModel,
            workflowResult,
          },
        })

        return {
          invoice: updatedInvoice,
          workflowResult,
        }
      }

      return {
        invoice: updatedInvoice,
        workflowResult: null,
      }
    }),

  /**
   * Create invoice from timesheet
   * Auto-creates invoice with all timesheet data, expenses, and documents
   */
  createFromTimesheet: tenantProcedure
    .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
    .input(z.object({
      timesheetId: z.string(),
      senderId: z.string().optional(),
      receiverId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Load timesheet with all related data
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.timesheetId,
          tenantId: ctx.tenantId,
        },
        include: {
          entries: true,
          expenses: true,
          documents: true,
          contract: {
            include: {
              participants: true,
              currency: true,
            },
          },
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Timesheet not found" })
      }

      if (timesheet.invoiceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice already exists for this timesheet",
        })
      }

      // Calculate amounts
      const rate = new Prisma.Decimal(timesheet.contract?.rate ?? 0)
      const baseAmount = timesheet.baseAmount || new Prisma.Decimal(0)
      const totalExpenses = timesheet.totalExpenses || new Prisma.Decimal(0)
      const invoiceAmount = baseAmount.add(totalExpenses)

      // Calculate margin
      const marginCalculation = await MarginService.calculateMarginFromContract(
        timesheet.contractId!,
        parseFloat(invoiceAmount.toString())
      )

      const totalAmount = marginCalculation?.totalWithMargin || invoiceAmount

      // Prepare line items from timesheet entries
      // 🔥 FIX: Line items should be per day, NOT per hour
      // Rate is already a daily rate, so quantity should be 1 for each day
      const lineItems = []
      for (const entry of timesheet.entries) {
        lineItems.push({
          description: `Work on ${new Date(entry.date).toISOString().slice(0, 10)} (${entry.hours}h)${entry.description ? ': ' + entry.description : ''}`,
          quantity: new Prisma.Decimal(1), // 🔥 FIX: 1 day, not hours
          unitPrice: rate, // 🔥 Rate is per day
          amount: rate, // 🔥 FIX: Amount is rate per day (not hours * rate)
        })
      }

      // Add expense line items
      if (timesheet.expenses && timesheet.expenses.length > 0) {
        for (const expense of timesheet.expenses) {
          lineItems.push({
            description: `Expense: ${expense.title} - ${expense.description || ''}`,
            quantity: new Prisma.Decimal(1),
            unitPrice: expense.amount,
            amount: expense.amount,
          })
        }
      }

      // Create invoice
      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: timesheet.contractId,
          timesheetId: timesheet.id,
          createdBy: ctx.session.user.id,
          senderId: input.senderId,
          receiverId: input.receiverId,
          
          baseAmount: baseAmount,
          amount: invoiceAmount,
          marginAmount: marginCalculation?.marginAmount || new Prisma.Decimal(0),
          marginPercentage: marginCalculation?.marginPercentage || new Prisma.Decimal(0),
          totalAmount: totalAmount,
          currencyId: timesheet.contract?.currencyId,
          
          status: "submitted",
          workflowState: "pending_margin_confirmation",
          
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          
          description: `Invoice for timesheet ${timesheet.startDate.toISOString().slice(0, 10)} to ${timesheet.endDate.toISOString().slice(0, 10)}`,
          notes: input.notes || `Auto-generated from timesheet. Total hours: ${timesheet.totalHours}`,
          
          lineItems: {
            create: lineItems,
          },
        },
        include: {
          lineItems: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create margin entry
      if (marginCalculation) {
        await MarginService.createMarginForInvoice(
          invoice.id,
          timesheet.contractId!,
          {
            marginType: marginCalculation.marginType,
            marginPercentage: marginCalculation.marginPercentage,
            marginAmount: marginCalculation.marginAmount,
            calculatedMargin: marginCalculation.calculatedMargin,
          }
        )
      }

      // Link invoice back to timesheet
      await ctx.prisma.timesheet.update({
        where: { id: timesheet.id },
        data: { invoiceId: invoice.id },
      })

      // 🔥 NEW: Copy documents from timesheet to invoice
      if (timesheet.documents && timesheet.documents.length > 0) {
        const invoiceDocuments = timesheet.documents.map((doc: any) => ({
          invoiceId: invoice.id,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          description: doc.description,
          category: doc.category,
        }))

        await ctx.prisma.invoiceDocument.createMany({
          data: invoiceDocuments,
        })
      }

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? "",
        tenantId: ctx.tenantId,
        description: "Invoice created from timesheet",
        metadata: {
          timesheetId: timesheet.id,
          marginCalculated: !!marginCalculation,
          documentsCopied: timesheet.documents?.length || 0,
        },
      })

      return invoice
    }),

  /**
   * Get margin for invoice
   */
  getInvoiceMargin: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.READ_OWN]))
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          tenantId: ctx.tenantId,
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      const isAdmin = ctx.session.user.permissions.includes(P.LIST_GLOBAL)
      if (!isAdmin && invoice.createdBy !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      return MarginService.getMarginByInvoiceId(input.invoiceId)
    }),

  /**
   * Get margin history for invoice
   */
  getInvoiceMarginHistory: tenantProcedure
    .use(hasPermission(P.LIST_GLOBAL))
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return MarginService.getMarginHistory(input.invoiceId)
    }),

})
