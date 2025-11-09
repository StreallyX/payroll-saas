
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const contractRouter = createTRPCRouter({
  // Get all contracts for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.contract.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          agency: { select: { name: true, contactEmail: true } },
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          payrollPartner: { select: { name: true, contactEmail: true } },
          invoices: true,
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get contract by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          agency: true,
          contractor: {
            include: {
              user: true,
            },
          },
          payrollPartner: true,
          invoices: {
            orderBy: { createdAt: "desc" },
          },
        },
      })
    }),

  // Get contracts by agency ID
  getByAgencyId: tenantProcedure
    .input(z.object({ agencyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findMany({
        where: { 
          agencyId: input.agencyId,
          tenantId: ctx.tenantId,
        },
        include: {
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          payrollPartner: { select: { name: true } },
          invoices: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get contracts by contractor ID
  getByContractorId: tenantProcedure
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findMany({
        where: { 
          contractorId: input.contractorId,
          tenantId: ctx.tenantId,
        },
        include: {
          agency: { select: { name: true } },
          payrollPartner: { select: { name: true } },
          invoices: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Create contract
  create: tenantProcedure
    .input(z.object({
      agencyId: z.string(),
      contractorId: z.string(),
      payrollPartnerId: z.string(),
      companyId: z.string().optional(),
      currencyId: z.string().optional(),
      bankId: z.string().optional(),
      contractCountryId: z.string().optional(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      rate: z.number().positive().optional(),
      rateType: z.enum(["hourly", "daily", "monthly", "fixed"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
      margin: z.number().optional(),
      marginType: z.enum(["percentage", "fixed"]).optional(),
      marginPaidBy: z.enum(["client", "contractor"]).optional(),
      salaryType: z.enum(["gross", "net"]).optional(),
      invoiceDueDays: z.number().int().optional(),
      contractReference: z.string().optional(),
      contractVatRate: z.number().optional(),
      agencySignDate: z.date().optional(),
      contractorSignDate: z.date().optional(),
      notes: z.string().optional(),
      signedContractPath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
        include: {
          agency: { select: { name: true } },
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          payrollPartner: { select: { name: true } },
        },
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId
      })

      return contract
    }),

  // Update contract
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      agencyId: z.string().optional(),
      contractorId: z.string().optional(),
      payrollPartnerId: z.string().optional(),
      companyId: z.string().optional(),
      currencyId: z.string().optional(),
      bankId: z.string().optional(),
      contractCountryId: z.string().optional(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      rate: z.number().positive().optional(),
      rateType: z.enum(["hourly", "daily", "monthly", "fixed"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
      margin: z.number().optional(),
      marginType: z.enum(["percentage", "fixed"]).optional(),
      marginPaidBy: z.enum(["client", "contractor"]).optional(),
      salaryType: z.enum(["gross", "net"]).optional(),
      invoiceDueDays: z.number().int().optional(),
      contractReference: z.string().optional(),
      contractVatRate: z.number().optional(),
      agencySignDate: z.date().optional(),
      contractorSignDate: z.date().optional(),
      notes: z.string().optional(),
      signedContractPath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const contract = await ctx.prisma.contract.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
        include: {
          agency: { select: { name: true } },
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          payrollPartner: { select: { name: true } },
        },
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId
      })

      return contract
    }),

  // Delete contract
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.id }
      })

      await ctx.prisma.contract.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: contract?.title || "Unknown Contract",
        tenantId: ctx.tenantId
      })

      return { success: true }
    }),

  // Get contract statistics
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const totalContracts = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId },
      })

      const activeContracts = await ctx.prisma.contract.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "active",
        },
      })

      const draftContracts = await ctx.prisma.contract.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "draft",
        },
      })

      const completedContracts = await ctx.prisma.contract.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "completed",
        },
      })

      return {
        total: totalContracts,
        active: activeContracts,
        draft: draftContracts,
        completed: completedContracts,
      }
    }),
})
