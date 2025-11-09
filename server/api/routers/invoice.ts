
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const invoiceRouter = createTRPCRouter({
  // Get all invoices for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.invoice.findMany({
        where: { tenantId: ctx.tenantId },
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
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get invoice by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contract: {
            include: {
              agency: true,
              contractor: {
                include: {
                  user: true,
                },
              },
              payrollPartner: true,
            },
          },
        },
      })
    }),

  // Get invoices by contract ID
  getByContractId: tenantProcedure
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findMany({
        where: { 
          contractId: input.contractId,
          tenantId: ctx.tenantId,
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
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Create invoice
  create: tenantProcedure
    .input(z.object({
      contractId: z.string(),
      amount: z.number().positive(),
      invoiceRef: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
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
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        metadata: {
          amount: invoice.amount,
          status: invoice.status,
          contractId: invoice.contractId,
        },
        tenantId: ctx.tenantId,
      })

      return invoice
    }),

  // Update invoice
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      invoiceRef: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      paidAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const invoice = await ctx.prisma.invoice.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
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
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        metadata: {
          updatedFields: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return invoice
    }),

  // Delete invoice
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get invoice details before deleting
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!invoice) {
        throw new Error("Invoice not found")
      }

      const result = await ctx.prisma.invoice.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        metadata: {
          amount: invoice.amount,
          status: invoice.status,
        },
        tenantId: ctx.tenantId,
      })

      return result
    }),

  // Get invoice statistics
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const totalInvoices = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId },
      })

      const paidInvoices = await ctx.prisma.invoice.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "paid",
        },
      })

      const overdueInvoices = await ctx.prisma.invoice.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "overdue",
        },
      })

      const totalAmount = await ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId },
        _sum: { amount: true },
      })

      const paidAmount = await ctx.prisma.invoice.aggregate({
        where: { 
          tenantId: ctx.tenantId,
          status: "paid",
        },
        _sum: { amount: true },
      })

      return {
        total: totalInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        totalAmount: Number(totalAmount._sum.amount || 0),
        paidAmount: Number(paidAmount._sum.amount || 0),
      }
    }),
})
