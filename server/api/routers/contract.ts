import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE } from "../../rbac/permissions"

export const contractRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL CONTRACTS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
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
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // GET CONTRACT BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          agency: true,
          contractor: { include: { user: true } },
          payrollPartner: true,
          invoices: { orderBy: { createdAt: "desc" } },
        },
      })
    }),

  // ---------------------------------------------------------
  // GET BY AGENCY
  // ---------------------------------------------------------
  getByAgencyId: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ agencyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findMany({
        where: {
          agencyId: input.agencyId,
          tenantId: ctx.tenantId,
        },
        include: {
          contractor: { include: { user: { select: { name: true, email: true } } } },
          payrollPartner: { select: { name: true } },
          invoices: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // GET BY CONTRACTOR
  // ---------------------------------------------------------
  getByContractorId: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
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

  // ---------------------------------------------------------
  // CREATE CONTRACT
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.create))
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.contract.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
        include: {
          agency: { select: { name: true } },
          contractor: { include: { user: { select: { name: true, email: true } } } },
          payrollPartner: { select: { name: true } },
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
      })

      return contract
    }),

  // ---------------------------------------------------------
  // UPDATE CONTRACT
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.update))
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const contract = await ctx.prisma.contract.update({
        where: { id, tenantId: ctx.tenantId },
        data: updateData,
        include: {
          agency: { select: { name: true } },
          contractor: { include: { user: { select: { name: true, email: true } } } },
          payrollPartner: { select: { name: true } },
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
      })

      return contract
    }),

  // ---------------------------------------------------------
  // DELETE CONTRACT
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const contract = await ctx.prisma.contract.findUnique({ where: { id: input.id } })

      await ctx.prisma.contract.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACT,
        entityId: input.id,
        entityName: contract?.title || "Unknown Contract",
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // ---------------------------------------------------------
  // STATS
  // ---------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.contract.count({ where: { tenantId: ctx.tenantId } })
      const active = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      })
      const draft = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId, status: "draft" },
      })
      const completed = await ctx.prisma.contract.count({
        where: { tenantId: ctx.tenantId, status: "completed" },
      })

      return { total, active, draft, completed }
    }),
})
