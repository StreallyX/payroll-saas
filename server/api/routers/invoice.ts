import { z } from "zod"
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc"
import { PERMISSION_TREE } from "../../rbac/permissions"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { TRPCError } from "@trpc/server"
import { generateInvoiceNumber, calculateDueDate, InvoiceStatus } from "@/lib/types/invoices"
import { Prisma } from "@prisma/client"


export const invoiceRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(
      z.object({
        status: z.string().optional(),
        contractId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId }
      
      if (input?.status) {
        where.status = input.status
      }
      
      if (input?.contractId) {
        where.contractId = input.contractId
      }

      const [invoices, total] = await Promise.all([
        ctx.prisma.invoice.findMany({
          where,
          include: {
            contract: {
              include: {
                agency: { select: { name: true } },
                contractor: {
                  include: {
                    user: { select: { name: true, email: true } },
                  },
                },
                company: { select: { name: true } },
                payrollPartner: { select: { name: true } },
              },
            },
            lineItems: true,
          },
          orderBy: { createdAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.invoice.count({ where }),
      ])

      return { invoices, total }
    }),

  // ---------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              agency: true,
              contractor: { include: { user: true } },
              company: true,
              payrollPartner: true,
              currency: true,
              bank: true,
            },
          },
          lineItems: {
            orderBy: { id: "asc" },
          },
        },
      })

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        })
      }

      return invoice
    }),

  // ---------------------------------------------------------
  // GET BY CONTRACT
  // ---------------------------------------------------------
  getByContractId: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findMany({
        where: { contractId: input.contractId, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
              payrollPartner: { select: { name: true } },
            },
          },
          lineItems: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.create))
    .input(z.object({
      contractId: z.string(),
      invoiceNumber: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      taxAmount: z.number().min(0).default(0),
      issueDate: z.date(),
      dueDate: z.date(),
      description: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        amount: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify contract exists and belongs to tenant
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
      })

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        })
      }

      // Generate invoice number if not provided
      let invoiceNumber = input.invoiceNumber
      if (!invoiceNumber) {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        
        // Count invoices this month
        const startOfMonth = new Date(year, now.getMonth(), 1)
        const endOfMonth = new Date(year, now.getMonth() + 1, 0)
        
        const count = await ctx.prisma.invoice.count({
          where: {
            tenantId: ctx.tenantId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        })

        const sequence = String(count + 1).padStart(4, '0')
        invoiceNumber = `INV-${year}${month}-${sequence}`
      }

      // Calculate total amount
      const totalAmount = input.amount + input.taxAmount

      // Create invoice with line items
      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: input.contractId,
          invoiceNumber,
          amount: input.amount,
          currency: input.currency,
          taxAmount: input.taxAmount,
          totalAmount,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          description: input.description,
          notes: input.notes,
          status: input.status,
          createdById: ctx.session!.user.id,
          lineItems: input.lineItems ? {
            create: input.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          } : undefined,
        },
        include: {
          contract: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
              payrollPartner: { select: { name: true } },
            },
          },
          lineItems: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? undefined,
        tenantId: ctx.tenantId,
        metadata: {
          amount: invoice.amount,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          contractId: invoice.contractId,
        },
      })

      return invoice
    }),

  // ---------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      taxAmount: z.number().min(0).optional(),
      issueDate: z.date().optional(),
      dueDate: z.date().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      lineItems: z.array(z.object({
        id: z.string().optional(),
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        amount: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, lineItems, ...updateData } = input

      // Verify invoice exists
      const existingInvoice = await ctx.prisma.invoice.findFirst({
        where: { id, tenantId: ctx.tenantId },
        include: { lineItems: true },
      })

      if (!existingInvoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        })
      }

      // Calculate new total if amount or tax changed
      let totalAmount = existingInvoice.totalAmount
      if (updateData.amount !== undefined || updateData.taxAmount !== undefined) {
        const newAmount = updateData.amount ?? Number(existingInvoice.amount)
        const newTax = updateData.taxAmount ?? Number(existingInvoice.taxAmount)
        totalAmount = new Prisma.Decimal(newAmount).plus(new Prisma.Decimal(newTax))
      }

      // Update invoice
      const invoice = await ctx.prisma.invoice.update({
        where: { id, tenantId: ctx.tenantId },
        data: {
          ...updateData,
          ...(totalAmount !== existingInvoice.totalAmount && { totalAmount }),
        },
        include: {
          contract: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
              payrollPartner: { select: { name: true } },
            },
          },
          lineItems: true,
        },
      })

      // Update line items if provided
      if (lineItems) {
        // Delete existing line items
        await ctx.prisma.invoiceLineItem.deleteMany({
          where: { invoiceId: id },
        })

        // Create new line items
        await ctx.prisma.invoiceLineItem.createMany({
          data: lineItems.map(item => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        })
      }

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? undefined,
        tenantId: ctx.tenantId,
        metadata: { updatedFields: updateData },
      })

      return invoice
    }),

  // ---------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------
  updateStatus: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.update))
    .input(z.object({
      id: z.string(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.update({
        where: { id: input.id, tenantId: ctx.tenantId },
        data: {
          status: input.status,
          ...(input.status === "sent" && { sentDate: new Date() }),
          ...(input.status === "paid" && { paidDate: new Date() }),
        },
        include: {
          contract: {
            include: {
              contractor: { include: { user: true } },
            },
          },
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? undefined,
        tenantId: ctx.tenantId,
        description: `Changed invoice status to ${input.status}`,
      })

      return invoice
    }),

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        })
      }

      // Delete invoice (will cascade delete line items)
      await ctx.prisma.invoice.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceNumber ?? undefined,
        tenantId: ctx.tenantId,
        metadata: {
          amount: invoice.amount,
          status: invoice.status,
        },
      })

      return { success: true }
    }),

  // ---------------------------------------------------------
  // GENERATE FROM CONTRACT
  // ---------------------------------------------------------
  generateFromContract: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.create))
    .input(z.object({
      contractId: z.string(),
      period: z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get contract with details
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
        include: {
          contractor: { include: { user: true } },
          currency: true,
        },
      })

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        })
      }

      if (!contract.rate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Contract must have a rate to generate invoice",
        })
      }

      // Calculate invoice amount based on rate type
      let amount = Number(contract.rate)
      let description = `Invoice for ${contract.title || "Contract Services"}`

      const period = input.period || {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      }

      if (contract.rateType === "monthly") {
        description += ` - ${new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
      }

      // Calculate dates
      const issueDate = new Date()
      const dueDate = calculateDueDate(issueDate, contract.invoiceDueDays || 30)

      // Generate invoice number
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      const count = await ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: {
            gte: new Date(year, now.getMonth(), 1),
            lte: new Date(year, now.getMonth() + 1, 0),
          },
        },
      })

      const sequence = String(count + 1).padStart(4, '0')
      const invoiceNumber = `INV-${year}${month}-${sequence}`

      // Calculate tax
      const taxAmount = contract.contractVatRate 
        ? amount * (Number(contract.contractVatRate) / 100)
        : 0
      const totalAmount = amount + taxAmount

      // Create invoice
      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: input.contractId,
          invoiceNumber,
          amount,
          currency: contract.currency?.code || "USD",
          taxAmount,
          totalAmount,
          issueDate,
          dueDate,
          description,
          status: "draft",
          createdById: ctx.session!.user.id,
          lineItems: {
            create: [
              {
                description: `${contract.rateType || "Service"} - ${description}`,
                quantity: 1,
                unitPrice: amount,
                amount,
              },
            ],
          },
        },
        include: {
          contract: {
            include: {
              contractor: { include: { user: true } },
              agency: { select: { name: true } },
            },
          },
          lineItems: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber ?? undefined,
        tenantId: ctx.tenantId,
        description: `Auto-generated invoice from contract`,
      })

      return invoice
    }),

  // ---------------------------------------------------------
  // GET OVERDUE
  // ---------------------------------------------------------
  getOverdue: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .query(async ({ ctx }) => {
      return ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["sent", "overdue"] },
          dueDate: { lt: new Date() },
        },
        include: {
          contract: {
            include: {
              contractor: { include: { user: true } },
              agency: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      })
    }),

  // ---------------------------------------------------------
  // STATS
  // ---------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId },
      })

      const paid = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId, status: "paid" },
      })

      const overdue = await ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["sent", "overdue"] },
          dueDate: { lt: new Date() },
        },
      })

      const totalAmount = await ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId },
        _sum: { totalAmount: true },
      })

      const paidAmount = await ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId, status: "paid" },
        _sum: { totalAmount: true },
      })

      const overdueAmount = await ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["sent", "overdue"] },
          dueDate: { lt: new Date() },
        },
        _sum: { totalAmount: true },
      })

      return {
        total,
        paid,
        overdue,
        totalAmount: Number(totalAmount._sum.totalAmount ?? 0),
        paidAmount: Number(paidAmount._sum.totalAmount ?? 0),
        overdueAmount: Number(overdueAmount._sum.totalAmount ?? 0),
      }
    }),

  // ---------------------------------------------------------
  // GENERATE INVOICE NUMBER
  // ---------------------------------------------------------
  generateInvoiceNumber: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.create))
    .mutation(async ({ ctx }) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Count invoices this month
      const startOfMonth = new Date(year, now.getMonth(), 1)
      const endOfMonth = new Date(year, now.getMonth() + 1, 0)
      
      const count = await ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      })

      const sequence = String(count + 1).padStart(4, '0')
      const invoiceNumber = `INV-${year}${month}-${sequence}`

      return { invoiceNumber }
    }),

  // ---------------------------------------------------------
  // CONTRACTOR-SPECIFIC METHODS
  // ---------------------------------------------------------
  
  // Get contractor's own invoices
  getMyInvoices: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
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
      
      return ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          contract: {
            contractorId: user.contractor.id
          }
        },
        include: {
          contract: {
            include: {
              agency: { select: { name: true, id: true } },
              company: { select: { name: true, id: true } },
            }
          },
          lineItems: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }),
  
  // Create invoice for contractor
  createContractorInvoice: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.create))
    .input(z.object({
      contractId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.date().optional(),
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify contractor owns this contract
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
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        },
        include: {
          agency: true,
          payrollPartner: true,
          currency: true
        }
      })
      
      if (!contract) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Contract not found or not owned by you"
        })
      }
      
      // Calculate totals
      const subtotal = input.lineItems.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      )
      
      // Generate invoice number
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      const startOfMonth = new Date(year, now.getMonth(), 1)
      const endOfMonth = new Date(year, now.getMonth() + 1, 0)
      
      const count = await ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      })

      const sequence = String(count + 1).padStart(4, '0')
      const invoiceNumber = `INV-${year}${month}-${sequence}`
      
      // Calculate due date (default 30 days from now)
      const dueDate = input.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      // Create invoice
      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: contract.id,
          invoiceNumber,
          description: input.title || input.description || `Invoice for ${contract.contractReference}`,
          status: 'pending',
          amount: subtotal,
          taxAmount: 0,
          totalAmount: subtotal,
          currency: contract.currency?.code || 'USD',
          dueDate,
          notes: input.notes,
          lineItems: {
            create: input.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
            }))
          }
        },
        include: {
          lineItems: true,
          contract: {
            include: {
              agency: true,
              payrollPartner: true
            }
          }
        }
      })
      
      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        tenantId: ctx.tenantId,
        metadata: {
          invoiceNumber,
          contractId: contract.id,
          totalAmount: subtotal,
        },
      })


      
      // TODO: Implement smart routing logic
      // await routeInvoiceToApprover(invoice, contract)
      
      return invoice
    }),
  
  // Get invoice summary for contractor
  getMyInvoiceSummary: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })
      }
      
      const invoices = await ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          contract: {
            contractorId: user.contractor.id
          }
        }
      })
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const paidInvoices = invoices.filter(i => i.status === 'paid')
      const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent')
      const thisMonthPaid = paidInvoices.filter(i => i.paidAt && i.paidAt >= thisMonth)
      
      return {
        totalEarnings: paidInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
        pendingPayment: pendingInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
        paidThisMonth: thisMonthPaid.reduce((sum, i) => sum + Number(i.totalAmount), 0),
        totalInvoices: invoices.length,
        paidCount: paidInvoices.length,
        pendingCount: pendingInvoices.length,
      }
    }),
})
