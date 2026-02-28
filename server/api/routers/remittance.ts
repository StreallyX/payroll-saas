import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasAnyPermission, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";

import { getPermissionScope, buildWhereClause } from "../../../lib/rbac-helpers";

const READ_OWN = buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN);
const READ_GLOBAL = buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.GLOBAL);
const LIST_GLOBAL = buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL);

const CREATE_GLOBAL = buildPermissionKey(Resource.REMITTANCE, Action.CREATE, PermissionScope.GLOBAL);
const UPDATE_GLOBAL = buildPermissionKey(Resource.REMITTANCE, Action.UPDATE, PermissionScope.GLOBAL);
const DELETE_GLOBAL = buildPermissionKey(Resource.REMITTANCE, Action.DELETE, PermissionScope.GLOBAL);

// Helper to convert Decimal to number safely
const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (val.toNumber) return val.toNumber();
  return parseFloat(val.toString()) || 0;
};


// ==========================================================================
// 🔥 Helper to convert Decimal to number
// ==========================================================================
const serializeRemittance = (r: any) => ({
  ...r,
  amount: r.amount?.toNumber ? r.amount.toNumber() : r.amount,
  createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  completedAt: r.completedAt?.toISOString?.() ?? r.completedAt,
  processedAt: r.processedAt?.toISOString?.() ?? r.processedAt,
});

export const remittanceRouter = createTRPCRouter({

  // ============================================================
  // GET MY REMITTANCES
  // ============================================================
  getMyRemittances: tenantProcedure
    .use(hasAnyPermission([READ_OWN, READ_GLOBAL, LIST_GLOBAL]))
    .query(async ({ ctx }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        READ_OWN,
        READ_GLOBAL,
        ctx.session.user.isSuperAdmin
      );

      const remittances = await ctx.prisma.remittance.findMany({
        where: buildWhereClause(scope, {}, { tenantId: ctx.tenantId }),
        include: {
          contract: true,
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            }
          }
        },
        orderBy: { completedAt: "desc" }
      });

      return remittances.map(serializeRemittance);
    }),


  // ============================================================
  // GET BY ID
  // ============================================================
  getRemittanceById: tenantProcedure
    .use(hasAnyPermission([READ_OWN, READ_GLOBAL, LIST_GLOBAL]))
    .input(z.object({ remitId: z.string() }))
    .query(async ({ ctx, input }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        READ_OWN,
        READ_GLOBAL,
        ctx.session.user.isSuperAdmin
      );

      const remittance = await ctx.prisma.remittance.findFirst({
        where: buildWhereClause(scope, { id: input.remitId }, { tenantId: ctx.tenantId }),
        include: { 
          contract: true, 
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            }
          }
        }
      });

      if (!remittance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Remittance not found" });
      }

      return serializeRemittance(remittance);
    }),


  // ============================================================
  // SUMMARY
  // ============================================================
  getMyRemittanceSummary: tenantProcedure
    .use(hasAnyPermission([READ_OWN, READ_GLOBAL, LIST_GLOBAL]))
    .query(async ({ ctx }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        READ_OWN,
        READ_GLOBAL,
        ctx.session.user.isSuperAdmin
      );

      const remittances = (await ctx.prisma.remittance.findMany({
        where: buildWhereClause(scope, {}, { tenantId: ctx.tenantId }),
      })).map(serializeRemittance);

      const paid = remittances.filter(r => r.status === "completed");
      const processing = remittances.filter(r => r.status === "processing");

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const thisMonthPaid = paid.filter(r => r.completedAt && new Date(r.completedAt) >= monthStart);

      return {
        totalReceived: paid.reduce((s, r) => s + r.amount, 0),
        processing: processing.reduce((s, r) => s + r.amount, 0),
        thisMonth: thisMonthPaid.reduce((s, r) => s + r.amount, 0),
        averagePerPeriod: paid.length > 0
          ? paid.reduce((s, r) => s + r.amount, 0) / paid.length
          : 0,
      };
    }),


  // ============================================================
  // GET CONTRACT FINANCIAL SUMMARY (for remittance creation)
  // ============================================================
  getContractFinancialSummary: tenantProcedure
    .use(hasPermission(CREATE_GLOBAL))
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get contract with basic info
      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          tenantId: ctx.tenantId,
        },
        include: {
          currency: true,
        },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      // Get participants separately
      const participants = await ctx.prisma.contractParticipant.findMany({
        where: {
          contractId: input.contractId,
          isActive: true,
        },
        include: {
          user: true,
        },
      });

      // Get contractor participant
      const contractorParticipant = participants.find(
        (p: any) => p.role === "contractor" || p.role === "worker"
      );

      // Get contractor's default payment method if contractor exists
      let contractorBankAccount = null;
      if (contractorParticipant?.userId) {
        const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
          where: {
            userId: contractorParticipant.userId,
            isDefault: true,
          },
        });
        contractorBankAccount = paymentMethod;
      }

      // Get all invoices for this contract
      const invoices = await ctx.prisma.invoice.findMany({
        where: {
          contractId: input.contractId,
          tenantId: ctx.tenantId,
        },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          amount: true,
          totalAmount: true,
          marginAmount: true,
          baseAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Get existing remittances for this contract
      const existingRemittances = await ctx.prisma.remittance.findMany({
        where: {
          contractId: input.contractId,
          tenantId: ctx.tenantId,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          completedAt: true,
        },
      });

      // Calculate totals
      const totalInvoiced = invoices.reduce((sum, inv) => sum + toNumber(inv.totalAmount || inv.amount), 0);
      const paidInvoices = invoices.filter(inv => inv.status === "paid");
      const totalReceived = paidInvoices.reduce((sum, inv) => sum + toNumber(inv.totalAmount || inv.amount), 0);
      const totalMargin = invoices.reduce((sum, inv) => sum + toNumber(inv.marginAmount), 0);

      // Calculate already remitted amount
      const completedRemittances = existingRemittances.filter(r => r.status === "completed");
      const totalRemitted = completedRemittances.reduce((sum, r) => sum + toNumber(r.amount), 0);

      // Calculate suggested remittance amount (received - margin - already remitted)
      const suggestedAmount = Math.max(0, totalReceived - totalMargin - totalRemitted);

      return {
        contract: {
          id: contract.id,
          title: contract.title,
          reference: contract.contractReference,
          rate: toNumber(contract.rate),
          rateType: contract.rateType,
          margin: toNumber(contract.margin),
          marginType: contract.marginType,
          currency: contract.currency?.code || "USD",
        },
        contractor: contractorParticipant?.user ? {
          id: contractorParticipant.user.id,
          name: contractorParticipant.user.name,
          email: contractorParticipant.user.email,
        } : null,
        bankAccount: contractorBankAccount ? {
          bankName: contractorBankAccount.bankName,
          accountHolderName: contractorBankAccount.accountHolderName,
          accountNumber: contractorBankAccount.accountNumber
            ? `****${contractorBankAccount.accountNumber.slice(-4)}`
            : null,
          iban: contractorBankAccount.iban
            ? `****${contractorBankAccount.iban.slice(-4)}`
            : null,
        } : null,
        financials: {
          totalInvoiced,
          totalReceived,
          totalMargin,
          totalRemitted,
          pendingAmount: totalInvoiced - totalReceived,
          suggestedAmount,
        },
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          amount: toNumber(inv.amount),
          totalAmount: toNumber(inv.totalAmount || inv.amount),
          marginAmount: toNumber(inv.marginAmount),
          createdAt: inv.createdAt,
        })),
        existingRemittances: existingRemittances.map(r => ({
          id: r.id,
          amount: toNumber(r.amount),
          status: r.status,
          completedAt: r.completedAt,
        })),
      };
    }),

  // ============================================================
  // ADMIN: CREATE REMITTANCE
  // ============================================================
  createRemittance: tenantProcedure
    .use(hasPermission(CREATE_GLOBAL))
    .input(
      z.object({
        userId: z.string(),
        invoiceId: z.string().optional(),
        contractId: z.string().optional(),
        amount: z.number().min(0.01),
        currency: z.string().default("USD"),
        description: z.string().optional(),
        notes: z.string().optional(),
        // New fields for detailed remittance
        amountInvoiced: z.number().optional(),
        amountReceived: z.number().optional(),
        feeAmount: z.number().optional(),
        netAmount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Build description with breakdown if detailed data provided
      let description = input.description || "";
      if (input.amountInvoiced && input.amountReceived && input.feeAmount !== undefined) {
        const breakdown = [
          `Amount Invoiced: $${input.amountInvoiced.toFixed(2)}`,
          `Amount Received: $${input.amountReceived.toFixed(2)}`,
          `Fee: $${input.feeAmount.toFixed(2)}`,
          `Net Payment: $${input.amount.toFixed(2)}`,
        ].join("\n");
        description = description ? `${description}\n\n${breakdown}` : breakdown;
      }

      const result = await ctx.prisma.remittance.create({
        data: {
          tenantId: ctx.tenantId!,
          invoiceId: input.invoiceId || null,
          contractId: input.contractId || null,
          amount: input.amount,
          currency: input.currency,
          paymentType: "sent",
          recipientType: "contractor",
          recipientId: input.userId,
          senderId: ctx.session.user.id,
          description,
          notes: input.notes || "",
          status: "pending",
        }
      });

      return serializeRemittance(result);
    }),

  // ============================================================
  // ADMIN: UPDATE REMITTANCE (status + description + notes)
  // ============================================================
  update: tenantProcedure
    .use(hasPermission(UPDATE_GLOBAL))
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "completed", "failed"]),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      const result = await ctx.prisma.remittance.update({
        where: { id: input.id },
        data: {
          status: input.status,
          description: input.description ?? undefined,
          notes: input.notes ?? undefined,

          // Auto update timestamps based on status
          completedAt:
            input.status === "completed" ? now : undefined,
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          contract: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            }
          }
        },
      });

      return serializeRemittance(result);
    }),



  // ============================================================
  // ADMIN: DELETE
  // ============================================================
  delete: tenantProcedure
    .use(hasPermission(DELETE_GLOBAL))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      return ctx.prisma.remittance.delete({
        where: { id: input.id },
      });
    }),

});
