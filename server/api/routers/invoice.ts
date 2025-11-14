import { z } from "zod"
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc"
import { PERMISSION_TREE } from "../../rbac/permissions"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const invoiceRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
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

  // ---------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              agency: true,
              contractor: { include: { user: true } },
              payrollPartner: true,
            },
          },
        },
      })
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
        },
      })
    }),

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.invoices.create))
    .input(z.object({
      contractId: z.string(),
      amount: z.number().positive(),
      invoiceRef: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {

      const invoice = await ctx.prisma.invoice.create({
        data: { ...input, tenantId: ctx.tenantId },
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

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
        metadata: {
          amount: invoice.amount,
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
      invoiceRef: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      paidAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const { id, ...updateData } = input

      const invoice = await ctx.prisma.invoice.update({
        where: { id, tenantId: ctx.tenantId },
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

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
        metadata: { updatedFields: updateData },
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

      if (!invoice) throw new Error("Invoice not found")

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
        entityName: invoice.invoiceRef || `Invoice-${invoice.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
        metadata: {
          amount: invoice.amount,
          status: invoice.status,
        },
      })

      return { success: true }
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
        where: { tenantId: ctx.tenantId, status: "overdue" },
      })

      const totalAmount = await ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId },
        _sum: { amount: true },
      })

      const paidAmount = await ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId, status: "paid" },
        _sum: { amount: true },
      })

      return {
        total,
        paid,
        overdue,
        totalAmount: Number(totalAmount._sum.amount ?? 0),
        paidAmount: Number(paidAmount._sum.amount ?? 0),
      }
    }),
})
