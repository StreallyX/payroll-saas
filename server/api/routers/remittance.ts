
import { z } from "zod"
import { createTRPCRouter, tenantProcedure, hasAnyPermission } from "../trpc"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"
import { TRPCError } from "@trpc/server"
import { 
  getPermissionScope, 
  PermissionScope, 
  buildWhereClause 
} from "../../../lib/rbac-helpers"

export const remittanceRouter = createTRPCRouter({
  
  // Get remittances (DEEL Pattern: view_own OR view_all)
  getMyRemittances: tenantProcedure
    .use(hasAnyPermission([
      PERMISSION_TREE_V2.payments.remits.view_own,
      PERMISSION_TREE_V2.payments.remits.view_all
    ]))
    .query(async ({ ctx }) => {
      // Determine permission scope
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        PERMISSION_TREE_V2.payments.remits.view_own,
        PERMISSION_TREE_V2.payments.remits.view_all,
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      });
      
      // Build where clause based on scope
      const scopeFilter = scope === PermissionScope.OWN 
        ? { contractorId: user?.contractor?.id } 
        : {};

      if (scope === PermissionScope.OWN && !user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        });
      }
      
      return ctx.prisma.remittance.findMany({
        where: buildWhereClause(
          scope,
          scopeFilter,
          { tenantId: ctx.tenantId }
        ),
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } }
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      });
    }),
  
  // Get remittance by ID (DEEL Pattern: view_own OR view_all)
  getRemittanceById: tenantProcedure
    .use(hasAnyPermission([
      PERMISSION_TREE_V2.payments.remits.view_own,
      PERMISSION_TREE_V2.payments.remits.view_all
    ]))
    .input(z.object({ remitId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Determine permission scope
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        PERMISSION_TREE_V2.payments.remits.view_own,
        PERMISSION_TREE_V2.payments.remits.view_all,
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      });
      
      // Build where clause based on scope
      const whereClause: any = {
        id: input.remitId,
        tenantId: ctx.tenantId
      };

      if (scope === PermissionScope.OWN) {
        whereClause.contractorId = user?.contractor?.id;
      }

      const remittance = await ctx.prisma.remittance.findFirst({
        where: whereClause,
        include: {
          contract: {
            include: {
              agency: { select: { name: true, id: true } },
              company: { select: { name: true, id: true } }
            }
          }
        }
      });
      
      if (!remittance) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Remittance not found" 
        });
      }
      
      return remittance;
    }),
  
  // Get remittance summary stats (DEEL Pattern: view_own OR view_all)
  getMyRemittanceSummary: tenantProcedure
    .use(hasAnyPermission([
      PERMISSION_TREE_V2.payments.remits.view_own,
      PERMISSION_TREE_V2.payments.remits.view_all
    ]))
    .query(async ({ ctx }) => {
      // Determine permission scope
      const scope = getPermissionScope(
        ctx.session.user.permissions || [],
        PERMISSION_TREE_V2.payments.remits.view_own,
        PERMISSION_TREE_V2.payments.remits.view_all,
        ctx.session.user.isSuperAdmin
      );

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      });

      // Build where clause based on scope
      const scopeFilter = scope === PermissionScope.OWN 
        ? { contractorId: user?.contractor?.id } 
        : {};

      if (scope === PermissionScope.OWN && !user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" });
      }
      
      const remittances = await ctx.prisma.remittance.findMany({
        where: buildWhereClause(
          scope,
          scopeFilter,
          { tenantId: ctx.tenantId }
        )
      })
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const paidRemittances = remittances.filter(r => r.status === 'paid')
      const processingRemittances = remittances.filter(r => r.status === 'processing')
      const thisMonthRemittances = remittances.filter(r => r.paymentDate >= thisMonth && r.status === 'paid')
      
      return {
        totalReceived: paidRemittances.reduce((sum, r) => sum + Number(r.netPay), 0),
        processing: processingRemittances.reduce((sum, r) => sum + Number(r.netPay), 0),
        thisMonth: thisMonthRemittances.reduce((sum, r) => sum + Number(r.netPay), 0),
        averagePerPeriod: paidRemittances.length > 0 
          ? paidRemittances.reduce((sum, r) => sum + Number(r.netPay), 0) / paidRemittances.length
          : 0,
        totalCount: remittances.length,
        paidCount: paidRemittances.length,
      }
    }),
})
