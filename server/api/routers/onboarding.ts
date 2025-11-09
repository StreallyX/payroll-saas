
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, adminProcedure } from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";

export const onboardingRouter = createTRPCRouter({
  // ==================== TEMPLATES ====================
  
  // Get all onboarding templates
  getAllTemplates: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.onboardingTemplate.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { questions: true, contractors: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get template by ID
  getTemplateById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.onboardingTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          contractors: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      });
    }),

  // Create onboarding template (Admin only)
  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.onboardingTemplate.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      });

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: "ONBOARDING_TEMPLATE" as any,
        entityId: template.id,
        entityName: template.name,
        tenantId: ctx.tenantId,
      });

      return template;
    }),

  // Update onboarding template (Admin only)
  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const template = await ctx.prisma.onboardingTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
      });

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: "ONBOARDING_TEMPLATE" as any,
        entityId: template.id,
        entityName: template.name,
        tenantId: ctx.tenantId,
      });

      return template;
    }),

  // Delete onboarding template (Admin only)
  deleteTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.onboardingTemplate.findUnique({
        where: { id: input.id },
      });

      await ctx.prisma.onboardingTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: "ONBOARDING_TEMPLATE" as any,
        entityId: input.id,
        entityName: template?.name || "Unknown",
        tenantId: ctx.tenantId,
      });

      return { success: true };
    }),

  // ==================== QUESTIONS ====================

  // Add question to template (Admin only)
  addQuestion: adminProcedure
    .input(
      z.object({
        onboardingTemplateId: z.string(),
        questionText: z.string().min(1),
        questionType: z.enum(["file_upload", "text", "date", "number"]),
        isRequired: z.boolean().default(true),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.prisma.onboardingQuestion.create({
        data: input,
      });

      return question;
    }),

  // Update question (Admin only)
  updateQuestion: adminProcedure
    .input(
      z.object({
        id: z.string(),
        questionText: z.string().min(1).optional(),
        questionType: z
          .enum(["file_upload", "text", "date", "number"])
          .optional(),
        isRequired: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const question = await ctx.prisma.onboardingQuestion.update({
        where: { id },
        data: updateData,
      });

      return question;
    }),

  // Delete question (Admin only)
  deleteQuestion: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.onboardingQuestion.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ==================== RESPONSES ====================

  // Get all contractors with their onboarding status (Admin view)
  getAllContractorOnboarding: adminProcedure.query(async ({ ctx }) => {
    const contractors = await ctx.prisma.contractor.findMany({
      where: {
        tenantId: ctx.tenantId,
        onboardingTemplateId: { not: null },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        onboardingTemplate: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        onboardingResponses: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate onboarding status for each contractor
    return contractors.map((contractor) => {
      const totalQuestions = contractor.onboardingTemplate?.questions.length || 0;
      const completedResponses = contractor.onboardingResponses.filter(
        (r) => r.status === "approved"
      ).length;
      const pendingResponses = contractor.onboardingResponses.filter(
        (r) => r.status === "pending" && (r.responseText || r.responseFilePath)
      ).length;

      return {
        ...contractor,
        stats: {
          totalQuestions,
          completedResponses,
          pendingResponses,
          progress: totalQuestions > 0 
            ? Math.round((completedResponses / totalQuestions) * 100)
            : 0,
        },
      };
    });
  }),

  // Get contractor's own onboarding responses
  getMyOnboardingResponses: tenantProcedure.query(async ({ ctx }) => {
    // Find contractor by user ID
    const contractor = await ctx.prisma.contractor.findFirst({
      where: {
        userId: ctx.session?.user?.id,
        tenantId: ctx.tenantId,
      },
      include: {
        onboardingTemplate: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        onboardingResponses: {
          include: {
            question: true,
          },
        },
      },
    });

    return contractor;
  }),

  // Get specific contractor's onboarding (Admin view)
  getContractorOnboarding: adminProcedure
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contractor = await ctx.prisma.contractor.findFirst({
        where: {
          id: input.contractorId,
          tenantId: ctx.tenantId,
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
          onboardingTemplate: {
            include: {
              questions: {
                orderBy: { order: "asc" },
              },
            },
          },
          onboardingResponses: {
            include: {
              question: true,
            },
            orderBy: {
              question: {
                order: "asc",
              },
            },
          },
        },
      });

      return contractor;
    }),

  // Submit/update response (Contractor can fill)
  submitResponse: tenantProcedure
    .input(
      z.object({
        contractorId: z.string(),
        questionId: z.string(),
        responseText: z.string().optional(),
        responseFilePath: z.string().optional(), // S3 path
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { contractorId, questionId, ...responseData } = input;

      // Check if response already exists
      const existingResponse = await ctx.prisma.onboardingResponse.findUnique({
        where: {
          contractorId_questionId: {
            contractorId,
            questionId,
          },
        },
      });

      let response;
      if (existingResponse) {
        // Update existing response
        response = await ctx.prisma.onboardingResponse.update({
          where: {
            contractorId_questionId: {
              contractorId,
              questionId,
            },
          },
          data: {
            ...responseData,
            submittedAt: new Date(),
            status: "pending", // Reset to pending when contractor updates
          },
        });
      } else {
        // Create new response
        response = await ctx.prisma.onboardingResponse.create({
          data: {
            contractorId,
            questionId,
            ...responseData,
            submittedAt: new Date(),
            status: "pending",
          },
        });
      }

      return response;
    }),

  // Approve response (Admin only)
  approveResponse: adminProcedure
    .input(z.object({ responseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "approved",
          reviewedAt: new Date(),
        },
        include: {
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          question: true,
        },
      });

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: "ONBOARDING_RESPONSE" as any,
        entityId: response.id,
        entityName: `${response.contractor.user.name} - ${response.question.questionText}`,
        metadata: { status: "approved" },
        tenantId: ctx.tenantId,
      });

      return response;
    }),

  // Reject response (Admin only)
  rejectResponse: adminProcedure
    .input(
      z.object({
        responseId: z.string(),
        adminNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.prisma.onboardingResponse.update({
        where: { id: input.responseId },
        data: {
          status: "rejected",
          adminNotes: input.adminNotes,
          reviewedAt: new Date(),
        },
        include: {
          contractor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          question: true,
        },
      });

      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: "ONBOARDING_RESPONSE" as any,
        entityId: response.id,
        entityName: `${response.contractor.user.name} - ${response.question.questionText}`,
        metadata: { status: "rejected", notes: input.adminNotes },
        tenantId: ctx.tenantId,
      });

      return response;
    }),
});
