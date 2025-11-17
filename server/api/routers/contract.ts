import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"
import { TRPCError } from "@trpc/server"
import { 
  ContractWorkflowStatus, 
  isValidTransition,
  ContractDocumentType 
} from "@/lib/types/contracts"

export const contractRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL CONTRACTS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.create))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.delete))
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
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
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

  // ---------------------------------------------------------
  // UPDATE WORKFLOW STATUS
  // ---------------------------------------------------------
  updateWorkflowStatus: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(
      z.object({
        id: z.string(),
        workflowStatus: z.enum([
          "draft",
          "pending_agency_sign",
          "pending_contractor_sign",
          "active",
          "paused",
          "completed",
          "cancelled",
          "terminated",
        ]),
        reason: z.string().optional(),
        terminationReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current contract
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        })
      }

      // Validate transition
      const currentStatus = contract.workflowStatus as ContractWorkflowStatus
      const newStatus = input.workflowStatus as ContractWorkflowStatus

      if (!isValidTransition(currentStatus, newStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        })
      }

      // Update contract
      const updatedContract = await ctx.prisma.contract.update({
        where: { id: input.id, tenantId: ctx.tenantId },
        data: {
          workflowStatus: input.workflowStatus,
          ...(input.workflowStatus === "terminated" && {
            terminationReason: input.terminationReason,
            terminatedAt: new Date(),
            terminatedBy: ctx.session!.user.id,
          }),
        },
      })

      // Record status history
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: input.id,
          fromStatus: contract.workflowStatus,
          toStatus: input.workflowStatus,
          changedBy: ctx.session!.user.id,
          reason: input.reason,
          metadata: {
            userId: ctx.session!.user.id,
            userName: ctx.session!.user.name,
            userRole: ctx.session!.user.roleName,
          },
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
        description: `Changed workflow status from ${contract.workflowStatus} to ${input.workflowStatus}`,
      })

      return updatedContract
    }),

  // ---------------------------------------------------------
  // GET STATUS HISTORY
  // ---------------------------------------------------------
  getStatusHistory: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractStatusHistory.findMany({
        where: { contractId: input.contractId },
        orderBy: { changedAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // UPLOAD DOCUMENT
  // ---------------------------------------------------------
  uploadDocument: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(
      z.object({
        contractId: z.string(),
        type: z.enum(["contract", "amendment", "termination", "other"]),
        name: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify contract exists and belongs to tenant
      const contract = await ctx.prisma.contract.findFirst({
        where: { id: input.contractId, tenantId: ctx.tenantId },
      })

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        })
      }

      // Get the current max version for this document type
      const existingDocs = await ctx.prisma.contractDocument.findMany({
        where: {
          contractId: input.contractId,
          type: input.type,
        },
        orderBy: { version: "desc" },
        take: 1,
      })

      const newVersion = existingDocs.length > 0 ? existingDocs[0].version + 1 : 1

      // Create document
      const document = await ctx.prisma.contractDocument.create({
        data: {
          contractId: input.contractId,
          type: input.type,
          name: input.name,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          version: newVersion,
          uploadedBy: ctx.session!.user.id,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || `Contract-${contract.id.slice(0, 8)}`,
        tenantId: ctx.tenantId,
        description: `Uploaded document: ${input.name}`,
      })

      return document
    }),

  // ---------------------------------------------------------
  // GET DOCUMENTS
  // ---------------------------------------------------------
  getDocuments: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractDocument.findMany({
        where: { contractId: input.contractId },
        orderBy: { uploadedAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // DELETE DOCUMENT
  // ---------------------------------------------------------
  deleteDocument: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.contractDocument.findUnique({
        where: { id: input.id },
        include: { contract: true },
      })

      if (!document || document.contract.tenantId !== ctx.tenantId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        })
      }

      await ctx.prisma.contractDocument.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // ---------------------------------------------------------
  // CREATE NOTIFICATION
  // ---------------------------------------------------------
  createNotification: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(
      z.object({
        contractId: z.string(),
        recipientId: z.string(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.contractNotification.create({
        data: {
          contractId: input.contractId,
          recipientId: input.recipientId,
          type: input.type,
          title: input.title,
          message: input.message,
        },
      })

      return notification
    }),

  // ---------------------------------------------------------
  // GET NOTIFICATIONS
  // ---------------------------------------------------------
  getNotifications: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ contractId: z.string().optional(), recipientId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractNotification.findMany({
        where: {
          ...(input.contractId && { contractId: input.contractId }),
          ...(input.recipientId && { recipientId: input.recipientId }),
        },
        orderBy: { sentAt: "desc" },
      })
    }),

  // ---------------------------------------------------------
  // MARK NOTIFICATION AS READ
  // ---------------------------------------------------------
  markNotificationRead: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.contractNotification.update({
        where: { id: input.id },
        data: { readAt: new Date() },
      })

      return notification
    }),

  // ---------------------------------------------------------
  // GET EXPIRING CONTRACTS
  // ---------------------------------------------------------
  getExpiringContracts: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + input.days)

      return ctx.prisma.contract.findMany({
        where: {
          tenantId: ctx.tenantId,
          workflowStatus: "active",
          endDate: {
            lte: futureDate,
            gte: new Date(),
          },
        },
        include: {
          contractor: { include: { user: { select: { name: true, email: true } } } },
          agency: { select: { name: true } },
        },
        orderBy: { endDate: "asc" },
      })
    }),

  // ---------------------------------------------------------
  // GENERATE CONTRACT REFERENCE
  // ---------------------------------------------------------
  generateReference: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.create))
    .mutation(async ({ ctx }) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Count contracts this month
      const startOfMonth = new Date(year, now.getMonth(), 1)
      const endOfMonth = new Date(year, now.getMonth() + 1, 0)
      
      const count = await ctx.prisma.contract.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      })

      const sequence = String(count + 1).padStart(4, '0')
      const reference = `CTR-${year}${month}-${sequence}`

      return { reference }
    }),
})
