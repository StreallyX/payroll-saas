import { z } from "zod"
import { TRPCError } from "@trpc/server"    // ✅ FIX ICI

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
} from "../../rbac/permissions-v2"

export const onboardingRouter = createTRPCRouter({

  // -------------------------------------------------------
  // ADMIN — LIST ALL USERS WITH ONBOARDING
  // -------------------------------------------------------
  getAllUserOnboarding: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL)
      )
    )
    .query(async ({ ctx }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          tenantId: ctx.tenantId,
          onboardingTemplateId: { not: null },
        },
        include: {
          onboardingTemplate: {
            include: { questions: { orderBy: { order: "asc" } } },
          },
          onboardingResponses: {
            include: { question: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return users.map((u) => {
        const total = u.onboardingTemplate?.questions.length ?? 0
        const approved = u.onboardingResponses.filter(
          (r) => r.status === "approved"
        ).length
        const pending = u.onboardingResponses.filter(
          (r) =>
            r.status === "pending" &&
            (r.responseText || r.responseFilePath)
        ).length

        return {
          id: u.id,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
          },
          onboardingTemplate: u.onboardingTemplate,
          onboardingResponses: u.onboardingResponses,
          stats: {
            totalQuestions: total,
            completedResponses: approved,
            pendingResponses: pending,
            progress: total > 0 ? Math.round((approved / total) * 100) : 0,
          },
        }
      })
    }),


  // -------------------------------------------------------
  // USER — VIEW OWN ONBOARDING
  // -------------------------------------------------------
  getMyOnboardingResponses: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN)
      )
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findFirst({
        where: { id: ctx.session!.user.id, tenantId: ctx.tenantId },
        include: {
          onboardingTemplate: {
            include: { questions: { orderBy: { order: "asc" } } },
          },
          onboardingResponses: {
            include: { question: true },
            orderBy: { question: { order: "asc" } },
          },
        },
      })
    }),


  // -------------------------------------------------------
  // USER — SUBMIT RESPONSE
  // -------------------------------------------------------
  submitResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.SUBMIT, PermissionScope.OWN)
      )
    )
    .input(z.object({
      questionId: z.string(),
      responseText: z.string().optional(),
      responseFilePath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const existing = await ctx.prisma.onboardingResponse.findUnique({
        where: {
          userId_questionId: {
            userId,
            questionId: input.questionId,
          },
        },
      })

      if (existing) {
        return ctx.prisma.onboardingResponse.update({
          where: {
            userId_questionId: {
              userId,
              questionId: input.questionId,
            },
          },
          data: {
            responseText: input.responseText,
            responseFilePath: input.responseFilePath,
            submittedAt: new Date(),
            status: "pending",
          },
        })
      }

      return ctx.prisma.onboardingResponse.create({
        data: {
          userId,
          tenantId: ctx.tenantId,
          questionId: input.questionId,
          responseText: input.responseText,
          responseFilePath: input.responseFilePath,
          submittedAt: new Date(),
          status: "pending",
        },
      })
    }),


  // -------------------------------------------------------
  // ADMIN — APPROVE RESPONSE
  // -------------------------------------------------------
  approveResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.REVIEW, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ responseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: ctx.session!.user.id,
        },
        include: { user: true, question: true },
      })
    }),


  // -------------------------------------------------------
  // ADMIN — REJECT RESPONSE
  // -------------------------------------------------------
  rejectResponse: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.REVIEW, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({
      responseId: z.string(),
      adminNotes: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "rejected",
          adminNotes: input.adminNotes,
          reviewedAt: new Date(),
          reviewedBy: ctx.session!.user.id,
        },
        include: { user: true, question: true },
      })
    }),


  // -------------------------------------------------------
  // USER — START ONBOARDING (AUTO-CREATE)
  // -------------------------------------------------------
  startOnboarding: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(
          Resource.ONBOARDING_RESPONSE,
          Action.READ,
          PermissionScope.OWN
        )
      )
    )
    .mutation(async ({ ctx }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      const user = await ctx.prisma.user.findFirst({
        where: { id: userId, tenantId },
        include: { onboardingTemplate: true }
      });

      if (user?.onboardingTemplateId) {
        return { alreadyExists: true };
      }

      const template = await ctx.prisma.onboardingTemplate.findFirst({
        where: { tenantId },
        include: { questions: true }
      });

      if (!template) throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Aucun template d’onboarding configuré."
      });

      await ctx.prisma.user.update({
        where: { id: userId },
        data: { onboardingTemplateId: template.id }
      });

      await ctx.prisma.onboardingResponse.createMany({
        data: template.questions.map(q => ({
          userId,
          tenantId,
          questionId: q.id,
          status: "pending"
        }))
      });

      return { started: true };
    }),
});
