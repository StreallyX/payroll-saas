import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey
} from "../../rbac/permissions-v2"  // V3 builder


export const onboardingRouter = createTRPCRouter({


  // -------------------------------------------------------
  // TEMPLATES — VIEW ALL (tenant)
  // -------------------------------------------------------
  getAllTemplates: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.onboardingTemplate.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          questions: { orderBy: { order: "asc" }},
          _count: { select: { questions: true, contractors: true }},
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // -------------------------------------------------------
  // TEMPLATE — GET BY ID (tenant)
  // -------------------------------------------------------
  getTemplateById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.onboardingTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          questions: { orderBy: { order: "asc" }},
          contractors: { include: { user: { select: { name: true, email: true }}}},
        },
      })
    }),


  // -------------------------------------------------------
  // TEMPLATE — CREATE (tenant)
  // -------------------------------------------------------
  createTemplate: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.onboardingTemplate.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        entityType: AuditEntityType.ONBOARDING_TEMPLATE,
        action: AuditAction.CREATE,
        entityId: template.id,
        entityName: template.name,
        tenantId: ctx.tenantId,
      })

      return template
    }),


  // -------------------------------------------------------
  // TEMPLATE — UPDATE (tenant)
  // -------------------------------------------------------
  updateTemplate: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const template = await ctx.prisma.onboardingTemplate.update({
        where: { id, tenantId: ctx.tenantId },
        data: updateData,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        entityType: AuditEntityType.ONBOARDING_TEMPLATE,
        action: AuditAction.UPDATE,
        entityId: template.id,
        entityName: template.name,
        metadata: { changes: updateData },
        tenantId: ctx.tenantId,
      })

      return template
    }),


  // -------------------------------------------------------
  // TEMPLATE — DELETE (tenant)
  // -------------------------------------------------------
  deleteTemplate: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.onboardingTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!existing) throw new Error("Template not found")

      await ctx.prisma.onboardingTemplate.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        entityType: AuditEntityType.ONBOARDING_TEMPLATE,
        action: AuditAction.DELETE,
        entityId: input.id,
        entityName: existing.name,
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),


  // -------------------------------------------------------
  // QUESTIONS — CREATE (tenant)
  // -------------------------------------------------------
  addQuestion: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_QUESTION, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      onboardingTemplateId: z.string(),
      questionText: z.string().min(1),
      questionType: z.enum(["file_upload", "text", "date", "number"]),
      isRequired: z.boolean().default(true),
      order: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.onboardingQuestion.create({
        data: {
          ...input,
        },
      })
    }),


  // -------------------------------------------------------
  // QUESTIONS — UPDATE (tenant)
  // -------------------------------------------------------
  updateQuestion: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_QUESTION, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      id: z.string(),
      questionText: z.string().optional(),
      questionType: z.enum(["file_upload", "text", "date", "number"]).optional(),
      isRequired: z.boolean().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      return ctx.prisma.onboardingQuestion.update({
        where: { id },
        data: updateData,
      })
    }),


  // -------------------------------------------------------
  // QUESTIONS — DELETE (tenant)
  // -------------------------------------------------------
  deleteQuestion: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_QUESTION, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.onboardingQuestion.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),


  // -------------------------------------------------------
  // ADMIN VIEW — All contractor onboardings (tenant)
  // -------------------------------------------------------
  getAllContractorOnboarding: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      const contractors = await ctx.prisma.contractor.findMany({
        where: {
          tenantId: ctx.tenantId,
          onboardingTemplateId: { not: null }
        },
        include: {
          user: { select: { name: true, email: true }},
          onboardingTemplate: {
            include: { questions: { orderBy: { order: "asc" }} },
          },
          onboardingResponses: {
            include: { question: true }
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return contractors.map(c => {
        const total = c.onboardingTemplate?.questions.length ?? 0
        const approved = c.onboardingResponses.filter(r => r.status === "approved").length

        return {
          ...c,
          stats: {
            totalQuestions: total,
            completedResponses: approved,
            pendingResponses: c.onboardingResponses.filter(
              r => r.status === "pending" && (r.responseText || r.responseFilePath)
            ).length,
            progress: total > 0 ? Math.round((approved / total) * 100) : 0,
          }
        }
      })
    }),


  // -------------------------------------------------------
  // CONTRACTOR — View own onboarding (own scope)
  // -------------------------------------------------------
  getMyOnboardingResponses: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN)
      )
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.contractor.findFirst({
        where: {
          userId: ctx.session!.user.id,
          tenantId: ctx.tenantId,
        },
        include: {
          onboardingTemplate: {
            include: { questions: { orderBy: { order: "asc" }}},
          },
          onboardingResponses: { include: { question: true }},
        },
      })
    }),


  // -------------------------------------------------------
  // ADMIN VIEW — Single contractor onboarding
  // -------------------------------------------------------
  getContractorOnboarding: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractor.findFirst({
        where: { id: input.contractorId, tenantId: ctx.tenantId },
        include: {
          user: { select: { name: true, email: true }},
          onboardingTemplate: {
            include: { questions: { orderBy: { order: "asc" }}},
          },
          onboardingResponses: {
            include: { question: true },
            orderBy: { question: { order: "asc" }},
          },
        },
      })
    }),


  // -------------------------------------------------------
  // CONTRACTOR — Submit response
  // -------------------------------------------------------
  submitResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.CREATE, PermissionScope.OWN)
      )
    )
    .input(z.object({
      contractorId: z.string(),
      questionId: z.string(),
      responseText: z.string().optional(),
      responseFilePath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contractorId, questionId, ...data } = input

      const existing = await ctx.prisma.onboardingResponse.findUnique({
        where: { contractorId_questionId: { contractorId, questionId } },
      })

      if (existing) {
        return ctx.prisma.onboardingResponse.update({
          where: { contractorId_questionId: { contractorId, questionId }},
          data: {
            ...data,
            submittedAt: new Date(),
            status: "pending",
          },
        })
      }

      return ctx.prisma.onboardingResponse.create({
        data: {
          contractorId,
          questionId,
          ...data,
          submittedAt: new Date(),
          status: "pending",
        },
      })
    }),


  // -------------------------------------------------------
  // REVIEW — Approve response (tenant)
  // -------------------------------------------------------
  approveResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ responseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
        },
        include: {
          contractor: { include: { user: true }},
          question: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ONBOARDING_RESPONSE,
        entityId: response.id,
        entityName: `${response.contractor.user.name} - ${response.question.questionText}`,
        metadata: { status: "approved" },
        tenantId: ctx.tenantId,
      })

      return response
    }),


  // -------------------------------------------------------
  // REVIEW — Reject response (tenant)
  // -------------------------------------------------------
  rejectResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({
      responseId: z.string(),
      adminNotes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "rejected",
          adminNotes: input.adminNotes,
          reviewedAt: new Date(),
        },
        include: {
          contractor: { include: { user: true }},
          question: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ONBOARDING_RESPONSE,
        entityId: response.id,
        entityName: `${response.contractor.user.name} - ${response.question.questionText}`,
        metadata: {
          status: "rejected",
          notes: input.adminNotes,
        },
        tenantId: ctx.tenantId,
      })

      return response
    }),

})
