
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { hasPermission } from "../trpc"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"
import { TRPCError } from "@trpc/server"

export const remittanceRouter = createTRPCRouter({
  
  // Get contractor's own remittances (payment history)
  getMyRemittances: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payroll.view_all))
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
      
      return ctx.prisma.remittance.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        },
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
      })
    }),
  
  // Get remittance by ID
  getRemittanceById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payroll.view_all))
    .input(z.object({ remitId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      const remittance = await ctx.prisma.remittance.findFirst({
        where: {
          id: input.remitId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId
        },
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
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Remittance not found" 
        })
      }
      
      return remittance
    }),
  
  // Get remittance summary stats
  getMyRemittanceSummary: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.payments.payroll.view_all))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })
      }
      
      const remittances = await ctx.prisma.remittance.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        }
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
