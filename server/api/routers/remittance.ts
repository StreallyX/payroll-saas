import { z } from "zod"
import { createTRPCRouter, tenantProcedure, hasAnyPermission } from "../trpc"
import { TRPCError } from "@trpc/server"

import {
  Resource,
  Action,
  PermissionScope,   // ← permissions-v2 ONLY
  buildPermissionKey,
} from "../../rbac/permissions-v2"

// ← rbac-helpers SANS PermissionScope
import {
  getPermissionScope,
  buildWhereClause
} from "../../../lib/rbac-helpers"


export const remittanceRouter = createTRPCRouter({

  // ============================================================
  // GET MY REMITTANCES (OWN or GLOBAL)
  // ============================================================
  getMyRemittances: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL)
      ])
    )
    .query(async ({ ctx }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
        ctx.session.user.isSuperAdmin
      )

      return ctx.prisma.remittance.findMany({
        where: buildWhereClause(scope, {}, { tenantId: ctx.tenantId }),
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } }
            }
          }
        },
        orderBy: { completedAt: "desc" }
      })
    }),

  // ============================================================
  // GET REMITTANCE BY ID
  // ============================================================
  getRemittanceById: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL)
      ])
    )
    .input(z.object({ remitId: z.string() }))
    .query(async ({ ctx, input }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
        ctx.session.user.isSuperAdmin
      )

      const remittance = await ctx.prisma.remittance.findFirst({
        where: buildWhereClause(
          scope,
          { id: input.remitId },
          { tenantId: ctx.tenantId }
        ),
        include: {
          contract: {
            include: {
              agency: { select: { name: true, id: true } },
              company: { select: { name: true, id: true } }
            }
          }
        }
      })

      if (!remittance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Remittance not found" })
      }

      return remittance
    }),

  // ============================================================
  // SUMMARY
  // ============================================================
  getMyRemittanceSummary: tenantProcedure
    .use(
      hasAnyPermission([
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL)
      ])
    )
    .query(async ({ ctx }) => {

      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
        buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
        ctx.session.user.isSuperAdmin
      )

      const remittances = await ctx.prisma.remittance.findMany({
        where: buildWhereClause(scope, {}, { tenantId: ctx.tenantId }),
      })

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const paid = remittances.filter(r => r.status === "completed")
      const processing = remittances.filter(r => r.status === "processing")
      const thisMonthPaid = paid.filter(r => r.completedAt && r.completedAt >= thisMonth)

      return {
        totalReceived: paid.reduce((sum, r) => sum + Number(r.amount), 0),
        processing: processing.reduce((sum, r) => sum + Number(r.amount), 0),
        thisMonth: thisMonthPaid.reduce((sum, r) => sum + Number(r.amount), 0),
        averagePerPeriod:
          paid.length > 0
            ? paid.reduce((sum, r) => sum + Number(r.amount), 0) / paid.length
            : 0,
        totalCount: remittances.length,
        paidCount: paid.length
      }
    }),
})
