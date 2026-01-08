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
import { RemittanceService } from "@/lib/services/RemittanceService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"
import { PaymentModel } from "@/lib/constants/payment-models"

const P = {
  READ_OWN: "invoice.read.own",
  CREATE_OWN: "invoice.create.own",
  UPDATE_OWN: "invoice.update.own",
  CONFIRM_MARGIN_OWN: "invoice.confirmMargin.own",

  LIST_GLOBAL: "invoice.list.global",
  CREATE_GLOBAL: "invoice.create.global",
  UPDATE_GLOBAL: "invoice.update.global",
  DELETE_GLOBAL: "invoice.delete.global",
  SEND_GLOBAL: "invoice.send.global",
  APPROVE_GLOBAL: "invoice.approve.global",
  PAY_GLOBAL: "invoice.pay.global",
  CONFIRM_PAYMENT_GLOBAL: "invoice.confirm.global",
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
            select: {
              id: true,
              contractReference: true,
              invoiceDueTerm: true,
              paymentModel: true, // 🔥 REFACTOR: Include payment model from contract
              invoiceDueDays: true,
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
            select: {
              id: true,
              contractReference: true,
              paymentModel: true, // 🔥 REFACTOR: Include payment model from contract
              invoiceDueTerm: true,
              invoiceDueDays: true,
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
  // For agencies: view invoices of contracts where they are participants
  // ---------------------------------------------------------
  getMyAgencyInvoices: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      // Find all contracts where user is an agency
      const agencyContracts = await ctx.prisma.contractParticipant.findMany({
        where: {
          userId: ctx.session.user.id,
          role: "AGENCY",
          isActive: true,
        },
        select: { contractId: true },
      })

      const contractIds = agencyContracts.map(c => c.contractId)

      // Retrieve invoices of these contracts
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
                where: { role: "contractor" },
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
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
            companyUsers: {
              include: {
                company: {
                  include: {
                    bank: true,
                    country: true,
                  },
                },
              },
            },
            // 🔥 FIX: Include receiver's bank accounts for payment destination
            banks: {
              where: {
                isActive: true,
              },
              orderBy: {
                isPrimary: 'desc',
              },
            },
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

        // 🔥 NEW: Include timesheet with expenses
        timesheet: {
          include: {
            expenses: true,
          },
        },

        // 🔥 NEW: Include child invoices (generated invoices like self-invoices)
        childInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            workflowState: true,
            totalAmount: true,
            createdAt: true,
          },
        },

        // 🔥 NEW: Include payment tracking users
        agencyMarkedPaidByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentReceivedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        // 🔥 FIX: Include margin for margin confirmation workflow
        margin: {
          include: {
            overriddenByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },

        contract: {
          select: {
            id: true,
            contractReference: true,
            salaryType: true, // 🔥 REFACTOR: Use salaryType as source of truth
            invoiceDueTerm: true,
            invoiceDueDays: true,
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
                  include: {
                    bank: true,
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

    // Security: non-admin can only read items they created OR received
    if (!isAdmin && invoice.createdBy !== ctx.session.user.id && invoice.receiverId !== ctx.session.user.id) {
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

      // OWN → user must be active participant of the contract
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

      // Security: non-admin can only update items they created OR received
      if (!isAdmin && invoice.createdBy !== ctx.session.user.id && invoice.receiverId !== ctx.session.user.id) {
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
  // Allows agency to mark an invoice as paid
  // Automatically creates a Payment with status "pending"
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
      // 1. Retrieve invoice with contract and participants
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

      // 2. Check permissions (if not admin, verify user is the agency of the contract)
      const isAdmin = ctx.session.user.permissions.includes(P.PAY_GLOBAL)
      
      if (!isAdmin) {
        // Verify user is an agency participating in the contract
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

      // 3. Verify invoice is not already paid
      if (invoice.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is already marked as paid"
        })
      }

      // 4. Create a Payment with status "pending" (will be confirmed by admin)
      const payment = await ctx.prisma.payment.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          currency: invoice.contract?.currency?.code || "USD",
          status: "pending", // Awaiting admin confirmation
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

      // 5. Update invoice status to "paid"
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

      // 6. Create an audit log
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
   * Allows admin OR invoice receiver to review and optionally override margin before proceeding
   */
  confirmMargin: tenantProcedure
    .use(hasAnyPermission([P.CONFIRM_MARGIN_OWN, P.MODIFY_GLOBAL]))
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

      // Extra security: Ensure user is either admin, receiver, or creator
      // This is in addition to the permission check for defense in depth
      const isReceiver = invoice.receiverId === ctx.session.user.id;
      const isCreator = invoice.createdBy === ctx.session.user.id;
      const hasModifyPermission = ctx.session.user.permissions?.includes(P.MODIFY_GLOBAL)

      if (!isReceiver && !isCreator && !hasModifyPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to confirm margin for this invoice",
        });
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
      amountPaid: z.number().positive(),
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

      // Check if user has permission to mark this invoice as paid
      const isAdmin = ctx.session.user.permissions.includes(P.PAY_GLOBAL)
      
      // If not admin, verify that the user is the receiver of the invoice
      if (!isAdmin) {
        if (invoice.receiverId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only mark invoices as paid that are addressed to you",
          })
        }
      }

      // Update invoice with agency payment tracking
      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.invoiceId },
        data: {
          agencyMarkedPaidAt: new Date(),
          agencyMarkedPaidBy: ctx.session.user.id,
          amountPaidByAgency: new Prisma.Decimal(input.amountPaid),
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
          amountPaid: input.amountPaid,
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
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId,
        },
      })

      return updatedInvoice
    }),

  /**
   * Mark payment as received
   * Records when admin confirms payment receipt with actual amount received
   */
  markPaymentReceived: tenantProcedure
    .use(hasAnyPermission([P.CONFIRM_PAYMENT_GLOBAL, P.PAY_GLOBAL]))
    .input(z.object({
      invoiceId: z.string(),
      amountReceived: z.number().positive(),
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
          currencyRelation: {
            select: {
              code: true,
            },
          },
        },
      })

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" })
      }

      // Validate that invoice is in the correct state
      if (invoice.workflowState !== 'marked_paid_by_agency') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice must be in 'marked_paid_by_agency' state to confirm payment receipt",
        })
      }

      // Update invoice with payment received tracking
      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.invoiceId },
        data: {
          paymentReceivedAt: new Date(),
          paymentReceivedBy: ctx.session.user.id,
          amountReceived: new Prisma.Decimal(input.amountReceived),
        },
      })

      // 🔥 Create remittance for payment received by admin
      try {
        await RemittanceService.createPaymentReceivedRemittance({
          tenantId: ctx.tenantId,
          invoiceId: input.invoiceId,
          contractId: invoice.contract?.id,
          amount: input.amountReceived,
          currency: invoice.currencyRelation?.code || "USD",
          adminUserId: ctx.session.user.id, // Admin receiving payment
          agencyUserId: invoice.agencyMarkedPaidBy || invoice.senderId || ctx.session.user.id, // Agency who sent payment
          description: `Payment received for invoice ${invoice.invoiceNumber || input.invoiceId}`,
        });
      } catch (error) {
        console.error("Error creating remittance:", error);
        // Don't fail the entire operation if remittance creation fails
      }

      // Transition to payment received state
      await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.INVOICE,
        entityId: input.invoiceId,
        action: WorkflowAction.MARK_PAYMENT_RECEIVED,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
        metadata: {
          amountReceived: input.amountReceived,
        },
      })

      // 🔥 REFACTOR: Execute payment model workflow using contract's paymentModel (single source of truth)
      const paymentModel = invoice.contract?.paymentModel
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
            amountReceived: input.amountReceived,
            amountPaidByAgency: invoice.amountPaidByAgency?.toString(),
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

      // 🔥 FIX: Calculate margin ONLY on baseAmount (work), not on expenses
      const marginCalculation = await MarginService.calculateMarginFromContract(
        timesheet.contractId!,
        parseFloat(baseAmount.toString())
      )

      // 🔥 FIX: Total = baseAmount + margin + expenses
      const marginAmount = new Prisma.Decimal(marginCalculation?.marginAmount || 0)
      const totalAmount = baseAmount.add(marginAmount).add(totalExpenses)

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
          amount: baseAmount, // 🔥 FIX: amount should be baseAmount only (work)
          marginAmount: marginCalculation?.marginAmount || new Prisma.Decimal(0),
          marginPercentage: marginCalculation?.marginPercentage || new Prisma.Decimal(0),
          totalAmount: totalAmount, // 🔥 FIX: totalAmount = baseAmount + margin + expenses
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
      // Security: non-admin can only view margin for items they created OR received
      if (!isAdmin && invoice.createdBy !== ctx.session.user.id && invoice.receiverId !== ctx.session.user.id) {
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

  /**
   * Get pending actions for current user
   * Returns invoices that require user action based on their role and permissions
   */
  getPendingActions: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.READ_OWN]))
    .query(async ({ ctx }) => {
      const user = ctx.session.user;
      const tenantId = ctx.tenantId;
      const permissions = user.permissions || [];

      // Check user capabilities
      const isAdmin = permissions.includes(P.LIST_GLOBAL);
      const canReview = permissions.includes(P.REVIEW_GLOBAL);
      const canApprove = permissions.includes(P.APPROVE_GLOBAL);
      const canConfirmPayment = permissions.includes(P.CONFIRM_PAYMENT_GLOBAL);
      const canConfirmMargin = permissions.includes(P.CONFIRM_MARGIN_OWN);
      const canPay = permissions.includes(P.PAY_GLOBAL) || permissions.includes("invoice.pay.own");

      const pendingActions: any[] = [];

      // ===== ADMIN ACTIONS =====
      if (isAdmin) {
        // 1. Invoices pending review (submitted or pending_margin_confirmation)
        if (canReview) {
          const reviewInvoices = await ctx.prisma.invoice.findMany({
            where: {
              tenantId,
              workflowState: {
                in: ["submitted", "under_review"],
              },
            },
            include: {
              sender: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } },
              contract: { select: { id: true, contractReference: true, paymentModel: true } }, // 🔥 REFACTOR: Include paymentModel
            },
            orderBy: { createdAt: "asc" },
          });

          for (const invoice of reviewInvoices) {
            pendingActions.push({
              id: `review-${invoice.id}`,
              type: "review_invoice",
              priority: "high",
              invoice,
              actionLabel: "Review Invoice",
              actionDescription: "Invoice requires review and approval",
            });
          }
        }

        // 2. Invoices pending approval (submitted state)
        if (canApprove) {
          const approvalInvoices = await ctx.prisma.invoice.findMany({
            where: {
              tenantId,
              workflowState: "submitted",
            },
            include: {
              sender: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } },
              contract: { select: { id: true, contractReference: true, paymentModel: true } }, // 🔥 REFACTOR: Include paymentModel
            },
            orderBy: { createdAt: "asc" },
          });

          for (const invoice of approvalInvoices) {
            pendingActions.push({
              id: `approve-${invoice.id}`,
              type: "approve_invoice",
              priority: "high",
              invoice,
              actionLabel: "Approve Invoice",
              actionDescription: "Invoice awaiting approval",
            });
          }
        }

        // 3. Invoices marked as paid by agency - need payment confirmation
        if (canConfirmPayment) {
          const paymentConfirmInvoices = await ctx.prisma.invoice.findMany({
            where: {
              tenantId,
              workflowState: "marked_paid_by_agency",
            },
            include: {
              sender: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } },
              contract: { select: { id: true, contractReference: true, paymentModel: true } }, // 🔥 REFACTOR: Include paymentModel
            },
            orderBy: { createdAt: "asc" },
          });

          for (const invoice of paymentConfirmInvoices) {
            pendingActions.push({
              id: `confirm-payment-${invoice.id}`,
              type: "confirm_payment",
              priority: "high",
              invoice,
              actionLabel: "Confirm Payment",
              actionDescription: "Agency marked invoice as paid - confirm payment received",
            });
          }
        }
      }

      // ===== AGENCY/RECEIVER ACTIONS =====
      if (!isAdmin || canConfirmMargin || canPay) {
        // 4. Invoices pending margin confirmation (where user is receiver)
        if (canConfirmMargin) {
          const marginConfirmInvoices = await ctx.prisma.invoice.findMany({
            where: {
              tenantId,
              workflowState: "pending_margin_confirmation",
              receiverId: user.id,
            },
            include: {
              sender: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } },
              contract: { select: { id: true, contractReference: true, paymentModel: true } }, // 🔥 REFACTOR: Include paymentModel
            },
            orderBy: { createdAt: "asc" },
          });

          for (const invoice of marginConfirmInvoices) {
            pendingActions.push({
              id: `confirm-margin-${invoice.id}`,
              type: "confirm_margin",
              priority: "high",
              invoice,
              actionLabel: "Confirm Margin",
              actionDescription: "Confirm margin and amounts on this invoice",
            });
          }
        }

        // 5. Invoices sent/overdue - need to mark as paid (where user is receiver)
        if (canPay) {
          const payInvoices = await ctx.prisma.invoice.findMany({
            where: {
              tenantId,
              workflowState: {
                in: ["sent", "overdue"],
              },
              receiverId: user.id,
            },
            include: {
              sender: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } },
              contract: { select: { id: true, contractReference: true, paymentModel: true } }, // 🔥 REFACTOR: Include paymentModel
            },
            orderBy: [
              { workflowState: "desc" }, // overdue first
              { dueDate: "asc" },
            ],
          });

          for (const invoice of payInvoices) {
            const isOverdue = invoice.workflowState === "overdue";
            pendingActions.push({
              id: `mark-paid-${invoice.id}`,
              type: "mark_as_paid",
              priority: isOverdue ? "urgent" : "medium",
              invoice,
              actionLabel: "Mark as Paid",
              actionDescription: isOverdue
                ? "⚠️ OVERDUE - Mark this invoice as paid"
                : "Mark this invoice as paid",
            });
          }
        }
      }

      // Remove duplicates (in case user has multiple overlapping permissions)
      const uniqueActions = Array.from(
        new Map(pendingActions.map((action) => [action.id, action])).values()
      );

      // Group by action type
      const groupedActions = uniqueActions.reduce((acc: any, action: any) => {
        const type = action.type;
        if (!acc[type]) {
          acc[type] = {
            type,
            label: action.actionLabel,
            count: 0,
            actions: [],
          };
        }
        acc[type].count++;
        acc[type].actions.push(action);
        return acc;
      }, {});

      return {
        totalCount: uniqueActions.length,
        groups: Object.values(groupedActions),
        allActions: uniqueActions,
      };
    }),

  // ---------------------------------------------------------
  // POST-PAYMENT WORKFLOW ACTIONS
  // ---------------------------------------------------------

  /**
   * Generate self-invoice preview (GROSS workflow)
   * Shows what the self-invoice will look like before creation
   */
  generateSelfInvoicePreview: tenantProcedure
    .use(hasPermission(P.PAY_GLOBAL))
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
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
          currencyRelation: true,
          margin: true,
          timesheet: {
            include: {
              expenses: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Get contractor (sender) and tenant info
      const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
      const tenantParticipant = invoice.contract?.participants?.find((p) => p.role === "client");

      // Get contractor's user details and bank accounts
      let contractorUser = null;
      let contractorBankAccounts: any[] = [];
      let primaryBankAccount: any = null;

      if (contractor?.userId) {
        contractorUser = await ctx.prisma.user.findUnique({
          where: { id: contractor.userId },
          select: {
            id: true,
            name: true,
            email: true,
            onboardingStatus: true,
          },
        });

        // Fetch contractor's bank accounts
        contractorBankAccounts = await ctx.prisma.bank.findMany({
          where: {
            userId: contractor.userId,
            isActive: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        });

        // Auto-select primary bank account
        primaryBankAccount = contractorBankAccounts.find((bank) => bank.isPrimary) || contractorBankAccounts[0];
      }

      // Get tenant info
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
      });

      // Calculate expenses total
      const expensesTotal = invoice.timesheet?.expenses?.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      ) || 0;

      // 🔥 Calculate amount WITHOUT margin (baseAmount + expenses only)
      const baseAmountValue = Number(invoice.baseAmount || invoice.amount);
      const totalAmountWithoutMargin = baseAmountValue + expensesTotal;

      // Calculate self-invoice details (we invoice ourselves)
      const selfInvoiceData = {
        from: {
          name: tenantParticipant?.company?.name || tenant?.name || "Organization",
          email: tenantParticipant?.company?.contactEmail || "",
        },
        to: {
          name: contractor?.user?.name || contractor?.company?.name || "Contractor",
          email: contractor?.user?.email || contractor?.company?.contactEmail || "",
        },
        contractor: contractorUser ? {
          id: contractorUser.id,
          name: contractorUser.name,
          email: contractorUser.email,
          onboardingStatus: contractorUser.onboardingStatus || "pending",
        } : null,
        bankAccounts: contractorBankAccounts.map((bank) => ({
          id: bank.id,
          accountName: bank.accountName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          currency: bank.currency,
          usage: bank.usage,
          isPrimary: bank.isPrimary,
        })),
        selectedBankAccount: primaryBankAccount ? {
          id: primaryBankAccount.id,
          accountName: primaryBankAccount.accountName,
          bankName: primaryBankAccount.bankName,
          accountNumber: primaryBankAccount.accountNumber,
          currency: primaryBankAccount.currency,
          usage: primaryBankAccount.usage,
          isPrimary: primaryBankAccount.isPrimary,
        } : null,
        invoiceNumber: `SELF-${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        expenses: invoice.timesheet?.expenses?.map((expense) => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
        })) || [],
        subtotal: baseAmountValue,
        expensesTotal,
        totalAmount: totalAmountWithoutMargin, // 🔥 WITHOUT margin
        currency: invoice.currencyRelation?.code || "USD",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: `Self-invoice for payment processing. Original invoice: ${invoice.invoiceNumber || invoice.id}`,
      };

      return selfInvoiceData;
    }),

  /**
   * Create self-invoice (GROSS workflow)
   * Actually creates the self-invoice as a new Invoice record
   */
  createSelfInvoice: tenantProcedure
    .use(hasPermission(P.CREATE_GLOBAL))
    .input(z.object({ 
      invoiceId: z.string(),
      selectedBankAccountId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("🔍 [createSelfInvoice] Starting with input:", JSON.stringify(input, null, 2));
        console.log("🔍 [createSelfInvoice] User ID:", ctx.session.user.id);
        console.log("🔍 [createSelfInvoice] Tenant ID:", ctx.tenantId);

        const userId = ctx.session.user.id;

        // Step 1: Fetch invoice
        console.log("🔍 [createSelfInvoice] Step 1: Fetching invoice...");
        const invoice = await ctx.prisma.invoice.findFirst({
          where: { id: input.invoiceId, tenantId: ctx.tenantId },
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
            currencyRelation: true,
            timesheet: {
              include: {
                expenses: true,
              },
            },
          },
        });

        if (!invoice) {
          console.error("❌ [createSelfInvoice] Invoice not found:", input.invoiceId);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        console.log("✅ [createSelfInvoice] Invoice found:", {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          contractId: invoice.contractId,
          baseAmount: invoice.baseAmount?.toString(),
          amount: invoice.amount?.toString(),
          totalAmount: invoice.totalAmount?.toString(),
          currencyId: invoice.currencyId,
          hasContract: !!invoice.contract,
          lineItemsCount: invoice.lineItems?.length || 0,
        });

        // Step 2: Validate contract exists
        if (!invoice.contract) {
          console.error("❌ [createSelfInvoice] No contract linked to invoice");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invoice must be linked to a contract to create self-invoice",
          });
        }

        console.log("✅ [createSelfInvoice] Contract found:", {
          id: invoice.contract.id,
          participantsCount: invoice.contract.participants?.length || 0,
        });

        // Step 3: Get participants
        // 📋 ROLE MAPPING DOCUMENTATION:
        // Contract participants use LOWERCASE role names (as defined in createMinimalParticipant.ts):
        // - "contractor" = The worker/freelancer being paid (can be User or Company)
        // - "client" = The tenant company issuing the invoice (usually a Company)
        // - "approver" = Admin users who approve contracts
        // - "tenant" = Alternative tenant representation
        console.log("🔍 [createSelfInvoice] Step 3: Finding participants...");
        const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
        const tenantParticipant = invoice.contract?.participants?.find((p) => p.role === "client");

        console.log("🔍 [createSelfInvoice] Participants found:", {
          contractor: contractor ? {
            id: contractor.id,
            userId: contractor.userId,
            companyId: contractor.companyId,
            role: contractor.role,
          } : null,
          tenantParticipant: tenantParticipant ? {
            id: tenantParticipant.id,
            userId: tenantParticipant.userId,
            companyId: tenantParticipant.companyId,
            role: tenantParticipant.role,
          } : null,
        });

        // 🔥 FIX: Validate contractor exists (can be user or company)
        if (!contractor) {
          console.error("❌ [createSelfInvoice] Contractor participant not found");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Contractor participant not found for this invoice",
          });
        }

        // 🔥 FIX: Handle both user-based and company-based contractors
        if (!contractor.userId && !contractor.companyId) {
          console.error("❌ [createSelfInvoice] Contractor has no userId or companyId");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Contractor must be linked to either a user or company",
          });
        }

        // Determine contractor user ID (for bank accounts and receiverId)
        const contractorUserId = contractor.userId;
        console.log("✅ [createSelfInvoice] Contractor user ID:", contractorUserId);

        // Step 4: Fetch contractor's bank accounts (only if contractor is a user)
        console.log("🔍 [createSelfInvoice] Step 4: Fetching bank accounts...");
        let contractorBankAccounts: any[] = [];
        if (contractorUserId) {
          contractorBankAccounts = await ctx.prisma.bank.findMany({
            where: {
              userId: contractorUserId,
              isActive: true,
            },
            orderBy: {
              isPrimary: 'desc',
            },
          });
          console.log("✅ [createSelfInvoice] Bank accounts found:", contractorBankAccounts.length);
        } else {
          console.log("⚠️  [createSelfInvoice] Skipping bank accounts (company-based contractor)");
        }

        // Step 5: Determine which bank account to use
        console.log("🔍 [createSelfInvoice] Step 5: Selecting bank account...");
        let selectedBankAccount = null;
        if (input.selectedBankAccountId && contractorBankAccounts.length > 0) {
          selectedBankAccount = contractorBankAccounts.find(
            (bank) => bank.id === input.selectedBankAccountId
          );
          console.log("✅ [createSelfInvoice] Selected specified bank account:", selectedBankAccount?.id);
        } else if (contractorBankAccounts.length > 0) {
          // Auto-select primary or first available
          selectedBankAccount = contractorBankAccounts.find((bank) => bank.isPrimary) || contractorBankAccounts[0];
          console.log("✅ [createSelfInvoice] Auto-selected bank account:", selectedBankAccount?.id, "(isPrimary:", selectedBankAccount?.isPrimary, ")");
        } else {
          console.log("⚠️  [createSelfInvoice] No bank account available");
        }

        // Step 6: Calculate amounts
        console.log("🔍 [createSelfInvoice] Step 6: Calculating amounts...");
        const expensesTotal = invoice.timesheet?.expenses?.reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        ) || 0;

        // 🔥 Calculate amount WITHOUT margin (baseAmount + expenses only)
        const baseAmountValue = Number(invoice.baseAmount || invoice.amount);
        const totalAmountWithoutMargin = baseAmountValue + expensesTotal;

        console.log("✅ [createSelfInvoice] Amounts calculated:", {
          baseAmountValue,
          expensesTotal,
          totalAmountWithoutMargin,
        });

        // Step 7: Validate required fields for invoice creation
        console.log("🔍 [createSelfInvoice] Step 7: Validating required fields...");
        
        // Check if self-invoice already exists for this parent invoice
        const existingSelfInvoice = await ctx.prisma.invoice.findFirst({
          where: {
            parentInvoiceId: invoice.id,
            tenantId: ctx.tenantId,
          },
        });

        if (existingSelfInvoice) {
          console.error("❌ [createSelfInvoice] Self-invoice already exists:", existingSelfInvoice.id);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `A self-invoice already exists for this invoice (ID: ${existingSelfInvoice.id}, Number: ${existingSelfInvoice.invoiceNumber})`,
          });
        }

        if (!invoice.lineItems || invoice.lineItems.length === 0) {
          console.error("❌ [createSelfInvoice] No line items found");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invoice must have at least one line item",
          });
        }

        if (isNaN(baseAmountValue) || baseAmountValue <= 0) {
          console.error("❌ [createSelfInvoice] Invalid base amount:", baseAmountValue);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invoice must have a valid positive amount",
          });
        }

        console.log("✅ [createSelfInvoice] Validation passed");

        // Step 8: Create self-invoice with auto-confirmation
        console.log("🔍 [createSelfInvoice] Step 8: Creating self-invoice...");
        
        // Generate unique invoice number with timestamp to avoid collisions
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const baseInvoiceRef = invoice.invoiceNumber || invoice.id.slice(0, 8);
        const selfInvoiceNumber = `SELF-${baseInvoiceRef}-${timestamp}`;
        
        console.log("🔍 [createSelfInvoice] Generated invoice number:", selfInvoiceNumber);
        
        const invoiceData = {
          tenantId: ctx.tenantId,
          parentInvoiceId: invoice.id,
          contractId: invoice.contractId,
          invoiceNumber: selfInvoiceNumber,
          senderId: tenantParticipant?.userId || userId,
          receiverId: contractorUserId || undefined, // 🔥 FIX: Handle case where contractor is a company (no userId)
          status: "approved", // 🔥 Auto-confirmed
          workflowState: "approved", // 🔥 Auto-confirmed
          amount: baseAmountValue,
          totalAmount: totalAmountWithoutMargin, // 🔥 WITHOUT margin
          currencyId: invoice.currencyId,
          marginAmount: 0, // 🔥 NO margin for self-invoice
          marginPercentage: 0, // 🔥 NO margin for self-invoice
          baseAmount: baseAmountValue,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: `Self-invoice for payment processing`,
          notes: selectedBankAccount 
            ? `Generated from invoice ${invoice.invoiceNumber || invoice.id}. Payment to: ${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber} (${selectedBankAccount.accountName || 'Account'})`
            : contractorUserId 
              ? `Generated from invoice ${invoice.invoiceNumber || invoice.id}. No bank account on file.`
              : `Generated from invoice ${invoice.invoiceNumber || invoice.id}. Payment to company: ${contractor.company?.name || 'Contractor Company'}`,
          createdBy: userId,
          lineItems: {
            create: invoice.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
        };

        console.log("🔍 [createSelfInvoice] Invoice data prepared:", JSON.stringify({
          ...invoiceData,
          lineItems: { count: invoice.lineItems.length },
        }, null, 2));

        let selfInvoice;
        try {
          selfInvoice = await ctx.prisma.invoice.create({
            data: invoiceData,
            include: {
              lineItems: true,
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
        } catch (prismaError: any) {
          console.error("❌ [createSelfInvoice] Prisma error during invoice creation:", {
            code: prismaError.code,
            message: prismaError.message,
            meta: prismaError.meta,
          });

          // Handle specific Prisma errors
          if (prismaError.code === 'P2002') {
            // Unique constraint violation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `A self-invoice with number ${selfInvoiceNumber} already exists. Please try again.`,
            });
          } else if (prismaError.code === 'P2003') {
            // Foreign key constraint violation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid reference to related data (contract, currency, or user). Please verify the invoice data.",
            });
          } else if (prismaError.code === 'P2011') {
            // Null constraint violation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Missing required field: ${prismaError.meta?.target || 'unknown'}`,
            });
          }

          // Re-throw for generic handling
          throw prismaError;
        }

        console.log("✅ [createSelfInvoice] Self-invoice created:", {
          id: selfInvoice.id,
          invoiceNumber: selfInvoice.invoiceNumber,
          status: selfInvoice.status,
          workflowState: selfInvoice.workflowState,
        });

        // Step 9: Create remittance for payment sent to contractor (only if contractor is a user)
        console.log("🔍 [createSelfInvoice] Step 9: Creating remittance...");
        if (contractorUserId) {
          try {
            await RemittanceService.createPaymentSentToContractorRemittance({
              tenantId: ctx.tenantId,
              invoiceId: selfInvoice.id,
              contractId: invoice.contractId || undefined,
              amount: totalAmountWithoutMargin,
              currency: invoice.currencyRelation?.code || "USD",
              adminUserId: userId,
              contractorUserId: contractorUserId,
              description: `Payment to contractor for self-invoice ${selfInvoice.invoiceNumber}`,
            });
            console.log("✅ [createSelfInvoice] Remittance created successfully");
          } catch (error) {
            console.error("⚠️  [createSelfInvoice] Error creating remittance:", error);
            // Don't fail the entire operation if remittance creation fails
          }
        } else {
          console.log("⚠️  [createSelfInvoice] Skipping remittance (company-based contractor)");
        }

        // Step 10: Create audit log
        console.log("🔍 [createSelfInvoice] Step 10: Creating audit log...");
        await createAuditLog({
          userId,
          userName: ctx.session.user.name || "System",
          userRole: ctx.session.user.roleName || "admin",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.INVOICE,
          entityId: selfInvoice.id,
          entityName: `Self-Invoice ${selfInvoice.invoiceNumber}`,
          tenantId: ctx.tenantId,
          description: `Self-invoice created and auto-confirmed for GROSS payment workflow`,
          metadata: {
            parentInvoiceId: invoice.id,
            parentInvoiceNumber: invoice.invoiceNumber,
            totalAmount: totalAmountWithoutMargin,
            expensesTotal,
            baseAmount: baseAmountValue,
            bankAccountId: selectedBankAccount?.id,
            bankAccountName: selectedBankAccount?.accountName,
          },
        });

        console.log("✅ [createSelfInvoice] Audit log created");
        console.log("🎉 [createSelfInvoice] Self-invoice creation completed successfully");

        return selfInvoice;
      } catch (error: any) {
        console.error("❌ [createSelfInvoice] Error occurred:", {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
        });

        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create self-invoice: ${error.message}`,
          cause: error,
        });
      }
    }),

  /**
   * Create self-billing invoice (PAYROLL workflow)
   * System creates invoice on behalf of contractor
   */
  createSelfBillingInvoice: tenantProcedure
    .use(hasPermission(P.CREATE_GLOBAL))
    .input(z.object({ 
      invoiceId: z.string(),
      selectedBankAccountId: z.string().optional(), // 🔥 NEW: Allow selecting specific bank account
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
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
          currencyRelation: true,
          timesheet: {
            include: {
              expenses: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Get participants
      const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
      const tenantParticipant = invoice.contract?.participants?.find((p) => p.role === "client");

      // 🔥 FIX: Get tenant info for FROM party
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
      });

      // 🔥 FIX: Find payroll user for TO party (receiver)
      const payrollUser = await ctx.prisma.user.findFirst({
        where: {
          tenantId: ctx.tenantId,
          role: {
            name: { contains: "payroll", mode: "insensitive" },
          },
          isActive: true,
        },
        include: {
          role: true,
        },
      });

      // If no specific payroll user found, fall back to current admin user
      const receiverUserId = payrollUser?.id || userId;

      // 🔥 FIX: Query for payroll user's bank accounts (consistent with GROSS mode)
      const payrollBankAccounts = await ctx.prisma.bank.findMany({
        where: {
          userId: receiverUserId,
          isActive: true,
        },
        orderBy: {
          isPrimary: 'desc',
        },
      });

      // Determine which bank account to use
      let selectedBankAccount = null;
      if (input.selectedBankAccountId && payrollBankAccounts.length > 0) {
        selectedBankAccount = payrollBankAccounts.find(
          (bank) => bank.id === input.selectedBankAccountId
        );
      } else if (payrollBankAccounts.length > 0) {
        // Auto-select primary or first available
        selectedBankAccount = payrollBankAccounts.find((bank) => bank.isPrimary) || payrollBankAccounts[0];
      }

      // Calculate expenses total
      const expensesTotal = invoice.timesheet?.expenses?.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      ) || 0;

      // 🔥 Calculate amount WITHOUT margin (baseAmount + expenses only)
      const baseAmountValue = Number(invoice.baseAmount || invoice.amount);
      const totalAmountWithoutMargin = baseAmountValue + expensesTotal;

      // 🔥 FIX: Create self-billing invoice with correct FROM/TO parties
      const selfBillingInvoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          parentInvoiceId: invoice.id,
          contractId: invoice.contractId,
          invoiceNumber: `SB-${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
          senderId: tenantParticipant?.userId || userId, // 🔥 FIX: FROM = Admin/tenant company
          receiverId: receiverUserId, // 🔥 FIX: TO = Payroll user
          status: "approved",
          workflowState: "approved",
          amount: baseAmountValue,
          totalAmount: totalAmountWithoutMargin, // 🔥 WITHOUT margin
          currencyId: invoice.currencyId,
          marginAmount: 0, // 🔥 NO margin for self-billing invoice
          marginPercentage: 0, // 🔥 NO margin for self-billing invoice
          baseAmount: baseAmountValue,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: `Self-billing invoice for payroll processing`,
          // 🔥 FIX: Include bank account details in notes if available
          notes: selectedBankAccount 
            ? `Auto-generated from invoice ${invoice.invoiceNumber || invoice.id}. Payment destination: ${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber} (${selectedBankAccount.accountName || 'Payroll Account'})`
            : `Auto-generated from invoice ${invoice.invoiceNumber || invoice.id}. No bank account on file for payroll user.`,
          createdBy: userId,
          lineItems: {
            create: invoice.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
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
      });

      await createAuditLog({
        userId,
        userName: ctx.session.user.name || "System",
        userRole: ctx.session.user.roleName || "admin",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: selfBillingInvoice.id,
        entityName: `Self-Billing Invoice ${selfBillingInvoice.invoiceNumber}`,
        tenantId: ctx.tenantId,
        description: `Self-billing invoice created for PAYROLL workflow`,
        metadata: {
          parentInvoiceId: invoice.id,
          parentInvoiceNumber: invoice.invoiceNumber,
          totalAmount: totalAmountWithoutMargin,
          expensesTotal,
          baseAmount: baseAmountValue,
          bankAccountId: selectedBankAccount?.id,
          bankAccountName: selectedBankAccount?.accountName,
          payrollUserId: receiverUserId,
          payrollUserName: payrollUser?.name || ctx.session.user.name,
        },
      });

      return selfBillingInvoice;
    }),

  /**
   * Create payroll task (PAYROLL and PAYROLL_WE_PAY workflows)
   */
  createPayrollTask: tenantProcedure
    .use(hasPermission(P.PAY_GLOBAL))
    .input(
      z.object({
        invoiceId: z.string(),
        payrollUserId: z.string().optional(), // Who to assign the task to
        feeAmount: z.number().optional(), // For PAYROLL_WE_PAY
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
        include: {
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
          currencyRelation: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
      const contractorName = contractor?.user?.name || contractor?.company?.name || "Contractor";
      
      // Get contractor bank details (from user profile or company)
      const contractorBankInfo = contractor?.user?.profileData as any;

      // Determine assignee - default to first payroll user if not specified
      let assigneeId = input.payrollUserId;
      if (!assigneeId) {
        const payrollUser = await ctx.prisma.user.findFirst({
          where: {
            tenantId: ctx.tenantId,
            role: {
              name: { contains: "payroll", mode: "insensitive" },
            },
            isActive: true,
          },
        });
        assigneeId = payrollUser?.id || userId;
      }

      // Create task description with all relevant info
      const taskDescription = `
Payment received for ${contractorName}.

**Action Required:** 
Please complete legal/payroll processing and transfer NET salary to contractor.

**Contractor Information:**
- Name: ${contractorName}
- Email: ${contractor?.user?.email || contractor?.company?.contactEmail || "N/A"}
- Contract: ${invoice.contract?.contractReference || "N/A"}

**Payment Details:**
- Amount: ${invoice.totalAmount} ${invoice.currencyRelation?.code || "USD"}
- Invoice: ${invoice.invoiceNumber || invoice.id}
${input.feeAmount ? `- Payroll Fee: ${input.feeAmount} ${invoice.currencyRelation?.code || "USD"}` : ""}

**Bank Details:**
${contractorBankInfo?.bankName ? `- Bank: ${contractorBankInfo.bankName}` : "- Bank: To be provided"}
${contractorBankInfo?.accountNumber ? `- Account: ${contractorBankInfo.accountNumber}` : ""}

${input.notes || ""}
      `.trim();

      // Ensure assigneeId is set
      if (!assigneeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No payroll user found. Please assign a payroll user first.",
        });
      }

      const task = await ctx.prisma.task.create({
        data: {
          tenantId: ctx.tenantId,
          title: `Process Payroll Payment - ${contractorName}`,
          description: taskDescription,
          assignedTo: assigneeId,
          assignedBy: userId,
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      await createAuditLog({
        userId,
        userName: ctx.session.user.name || "System",
        userRole: ctx.session.user.roleName || "admin",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.TASK as any,
        entityId: task.id,
        entityName: task.title,
        tenantId: ctx.tenantId,
        description: `Payroll task created for invoice ${invoice.invoiceNumber || invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          contractorId: contractor?.userId,
        },
      });

      return task;
    }),

  /**
   * Get contractor bank accounts (for SPLIT workflow)
   */
  getContractorBankAccounts: tenantProcedure
    .use(hasAnyPermission([P.PAY_GLOBAL, P.READ_OWN]))
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              participants: {
                include: {
                  user: {
                    include: {
                      banks: {
                        where: { 
                          isActive: true,
                          userId: { not: null }, // Only user banks, not company banks
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
      const bankAccounts = contractor?.user?.banks || [];

      return {
        contractorName: contractor?.user?.name || "N/A",
        bankAccounts: bankAccounts.map((account) => ({
          id: account.id,
          bankName: account.name, // Bank.name instead of UserBankAccount.bankName
          accountNumber: account.accountNumber,
          accountHolder: account.accountHolder,
          isPrimary: account.isPrimary,
          currency: account.currency,
          country: account.country,
        })),
      };
    }),

  /**
   * Process split payment (SPLIT workflow)
   */
  processSplitPayment: tenantProcedure
    .use(hasPermission(P.PAY_GLOBAL))
    .input(
      z.object({
        invoiceId: z.string(),
        splits: z.array(
          z.object({
            bankAccountId: z.string(),
            amount: z.number().optional(),
            percentage: z.number().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              participants: {
                include: {
                  user: {
                    include: {
                      banks: true,
                    },
                  },
                },
              },
            },
          },
          currencyRelation: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const totalAmount = Number(invoice.totalAmount);

      // Validate splits
      let totalSplitAmount = 0;
      let totalPercentage = 0;

      for (const split of input.splits) {
        if (split.amount) {
          totalSplitAmount += split.amount;
        } else if (split.percentage) {
          totalPercentage += split.percentage;
          totalSplitAmount += (totalAmount * split.percentage) / 100;
        }
      }

      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Split amounts must equal invoice total. Expected: ${totalAmount}, Got: ${totalSplitAmount}`,
        });
      }

      // Create payment records for each split
      const payments = await Promise.all(
        input.splits.map(async (split, index) => {
          const bankAccount = await ctx.prisma.bank.findUnique({
            where: { id: split.bankAccountId },
          });

          if (!bankAccount) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Bank account ${split.bankAccountId} not found`,
            });
          }

          const splitAmount = split.amount || (totalAmount * (split.percentage || 0)) / 100;

          return ctx.prisma.payment.create({
            data: {
              tenantId: ctx.tenantId,
              invoiceId: invoice.id,
              amount: splitAmount,
              currency: invoice.currencyRelation?.code || "USD",
              status: "pending",
              paymentMethod: "bank_transfer",
              scheduledDate: new Date(),
              description: `Split payment ${index + 1}/${input.splits.length} to ${bankAccount.name}`,
              notes: split.notes || `Account: ${bankAccount.accountNumber}`,
              createdBy: userId,
              metadata: {
                paymentModel: PaymentModel.split,
                splitIndex: index + 1,
                totalSplits: input.splits.length,
                bankAccountId: bankAccount.id,
                bankName: bankAccount.name,
                accountNumber: bankAccount.accountNumber,
              },
            },
          });
        })
      );

      await createAuditLog({
        userId,
        userName: ctx.session.user.name || "System",
        userRole: ctx.session.user.roleName || "admin",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYMENT,
        entityId: payments[0].id,
        entityName: `Split Payment for ${invoice.invoiceNumber || invoice.id}`,
        tenantId: ctx.tenantId,
        description: `Split payment processed: ${payments.length} splits`,
        metadata: {
          invoiceId: invoice.id,
          splitCount: payments.length,
          paymentIds: payments.map((p) => p.id),
        },
      });

      return {
        success: true,
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          description: p.description,
          status: p.status,
        })),
      };
    }),

  /**
   * Create payroll fee invoice (PAYROLL_WE_PAY workflow)
   */
  createPayrollFeeInvoice: tenantProcedure
    .use(hasPermission(P.CREATE_GLOBAL))
    .input(
      z.object({
        invoiceId: z.string(),
        feeAmount: z.number(),
        feeDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.invoiceId, tenantId: ctx.tenantId },
        include: {
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
          currencyRelation: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const client = invoice.contract?.participants?.find((p) => p.role === "client");
      const tenantParticipant = invoice.contract?.participants?.find((p) => p.role === "client");

      // Create fee invoice
      const feeInvoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          parentInvoiceId: invoice.id,
          contractId: invoice.contractId,
          invoiceNumber: `FEE-${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
          senderId: tenantParticipant?.userId || userId,
          receiverId: client?.userId,
          status: "draft",
          workflowState: "draft",
          amount: input.feeAmount,
          totalAmount: input.feeAmount,
          currencyId: invoice.currencyId,
          baseAmount: input.feeAmount,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: input.feeDescription || `Payroll processing fee`,
          notes: `Fee for payroll processing of invoice ${invoice.invoiceNumber || invoice.id}`,
          createdBy: userId,
          lineItems: {
            create: [
              {
                description: input.feeDescription || "Payroll processing fee",
                quantity: 1,
                unitPrice: input.feeAmount,
                amount: input.feeAmount,
              },
            ],
          },
        },
        include: {
          lineItems: true,
        },
      });

      await createAuditLog({
        userId,
        userName: ctx.session.user.name || "System",
        userRole: ctx.session.user.roleName || "admin",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: feeInvoice.id,
        entityName: `Fee Invoice ${feeInvoice.invoiceNumber}`,
        tenantId: ctx.tenantId,
        description: `Payroll fee invoice created`,
        metadata: {
          parentInvoiceId: invoice.id,
          feeAmount: input.feeAmount,
        },
      });

      return feeInvoice;
    }),

})