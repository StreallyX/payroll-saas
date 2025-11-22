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
        include: { lineItems: true, contract: true },
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
        include: { lineItems: true, contract: true },
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
        include: { lineItems: true, contract: true },
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

})
