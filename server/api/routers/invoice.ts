import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"

import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2" // V3 builder

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"


export const invoiceRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL — tenant-scope only
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.TENANT)
      )
    )
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

      if (input?.status) where.status = input.status
      if (input?.contractId) where.contractId = input.contractId

      const [invoices, total] = await Promise.all([
        ctx.prisma.invoice.findMany({
          where,
          include: {
            contract: {
              include: {
                agency: { select: { name: true } },
                contractor: {
                  include: { user: { select: { name: true, email: true } } },
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
  // GET BY ID — tenant only
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.TENANT)
      )
    )
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
          lineItems: true,
        },
      })

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })
      return invoice
    }),

  // ---------------------------------------------------------
  // GET BY CONTRACT (tenant)
  // ---------------------------------------------------------
  getByContractId: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findMany({
        where: { contractId: input.contractId, tenantId: ctx.tenantId },
        include: {
          contract: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: { user: { select: { name: true, email: true } } },
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
  // CREATE — tenant scope only
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
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
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number().positive(),
              unitPrice: z.number().positive(),
              amount: z.number().positive(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
      })
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" })

      // Generate invoice number if missing
      let invoiceNumber = input.invoiceNumber
      const now = new Date()
      if (!invoiceNumber) {
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, "0")

        const count = await ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId },
        })

        invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, "0")}`
      }

      const totalAmount = input.amount + input.taxAmount

      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: input.contractId,
          invoiceNumber,
          amount: input.amount,
          taxAmount: input.taxAmount,
          totalAmount,
          currency: input.currency,
          description: input.description,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          notes: input.notes,
          status: input.status,
          createdBy: ctx.session.user.id,
          lineItems: input.lineItems
            ? {
                create: input.lineItems.map((i) => ({
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  amount: i.amount,
                })),
              }
            : undefined,
        },
        include: { lineItems: true },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: invoice.invoiceNumber!,
        tenantId: ctx.tenantId,
      })

      return invoice
    }),

  // ---------------------------------------------------------
  // UPDATE — tenant
  // ---------------------------------------------------------
  update: tenantProcedure
  .use(
    hasPermission(
      buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.TENANT)
    )
  )
  .input(
    z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      taxAmount: z.number().min(0).optional(),
      issueDate: z.date().optional(),
      dueDate: z.date().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      lineItems: z
        .array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number(),
            amount: z.number().positive(),
          })
        )
        .optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, lineItems, ...updateData } = input;

    const existingInvoice = await ctx.prisma.invoice.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existingInvoice) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // 1️⃣ UPDATE the invoice itself (WITHOUT lineItems)
    const updated = await ctx.prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
      },
    });

    // 2️⃣ IF lineItems provided → replace ALL
    if (lineItems) {
      await ctx.prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: id },
      });

      await ctx.prisma.invoiceLineItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      });
    }

    await createAuditLog({
      userId: ctx.session.user.id,
      userName: ctx.session.user.name!,
      userRole: ctx.session.user.roleName,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.INVOICE,
      entityId: id,
      entityName: existingInvoice.invoiceNumber ?? undefined,
      tenantId: ctx.tenantId,
    });

    return updated;
  }),


  // ---------------------------------------------------------
  // DELETE — tenant
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" })

      await ctx.prisma.invoice.delete({ where: { id: input.id } })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.INVOICE,
        entityId: input.id,
        entityName: invoice.invoiceNumber!,
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // ---------------------------------------------------------
  // GET MY INVOICES — OWN SCOPE
  // ---------------------------------------------------------
  getMyInvoices: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.OWN)
      )
    )
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      })
      if (!user?.contractor)
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })

      return ctx.prisma.invoice.findMany({
        where: {
          tenantId: ctx.tenantId,
          contract: { contractorId: user.contractor.id },
        },
        include: {
          lineItems: true,
          contract: {
            include: {
              agency: true,
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // CREATE OWN INVOICE — STRICT (no update/delete/submit)
  // ---------------------------------------------------------
  createContractorInvoice: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN)
      )
    )
    .input(
      z.object({
        contractId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number(),
          })
        ),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      })

      if (!user?.contractor)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found",
        })

      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id,
        },
        include: {
          agency: true,
          payrollPartner: true,
          currency: true,
        },
      })

      if (!contract)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Contract does not belong to you",
        })

      const subtotal = input.lineItems.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0
      )

      // Generate invoice number
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const count = await ctx.prisma.invoice.count({
        where: { tenantId: ctx.tenantId },
      })

      const invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(
        4,
        "0"
      )}`

      const dueDate =
        input.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          contractId: contract.id,
          invoiceNumber,
          description:
            input.title ||
            input.description ||
            `Invoice for ${contract.contractReference}`,
          status: "pending",
          amount: subtotal,
          taxAmount: 0,
          totalAmount: subtotal,
          currency: contract.currency?.code || "USD",
          dueDate,
          notes: input.notes,
          createdBy: ctx.session.user.id,
          lineItems: {
            create: input.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              amount: li.unitPrice * li.quantity,
            })),
          },
        },
        include: {
          lineItems: true,
        },
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        tenantId: ctx.tenantId,
      })

      return invoice
    }),

})
