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
      })
    )
    .mutation(async ({ ctx, input }) => {

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
          description: input.description || "",
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
