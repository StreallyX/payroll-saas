import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey
} from "../../rbac/permissions";

export const onboardingTemplateRouter = createTRPCRouter({

  // -------------------------------------------------------
  // ADMIN — LIST ALL TEMPLATES FOR TENANT
  // -------------------------------------------------------
  list: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL)
      )
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.onboardingTemplate.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          questions: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // ADMIN — GET TEMPLATE BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.READ, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tpl = await ctx.prisma.onboardingTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { questions: { orderBy: { order: "asc" } } },
      });
      if (!tpl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }
      return tpl;
    }),

  // -------------------------------------------------------
  // ADMIN — CREATE TEMPLATE
  // -------------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.CREATE, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      questions: z.array(z.object({
        questionText: z.string().min(1),
        questionType: z.enum(["text", "file"]),
        isRequired: z.boolean().optional(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      return ctx.prisma.onboardingTemplate.create({
        data: {
          tenantId: ctx.tenantId!,
          name: input.name,
          description: input.description,
          isActive: input.isActive ?? true,
          createdBy: userId,
          questions: {
            create: input.questions.map((q, index) => ({
              order: index,
              questionText: q.questionText,
              questionType: q.questionType,
              isRequired: q.isRequired ?? true,
            })),
          },
        },
        include: { questions: { orderBy: { order: "asc" } } },
      });
    }),

  // -------------------------------------------------------
  // ADMIN — UPDATE TEMPLATE (replace questions)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.UPDATE, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      questions: z.array(z.object({
        // we replace everything, id is optional/ignored
        questionText: z.string().min(1),
        questionType: z.enum(["text", "file"]),
        isRequired: z.boolean().optional(),
        order: z.number().int().nonnegative(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.onboardingTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      // Remplacement atomique via transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // ⚠️ Correct field: onboardingTemplateId (not templateId)
        await tx.onboardingQuestion.deleteMany({
          where: { onboardingTemplateId: input.id },
        });

        return tx.onboardingTemplate.update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            isActive: input.isActive ?? true,
            questions: {
              create: input.questions
                .sort((a, b) => a.order - b.order)
                .map((q) => ({
                  order: q.order,
                  questionText: q.questionText,
                  questionType: q.questionType,
                  isRequired: q.isRequired ?? true,
                })),
            },
          },
          include: { questions: { orderBy: { order: "asc" } } },
        });
      });

      return result;
    }),

  // -------------------------------------------------------
  // ADMIN — DELETE TEMPLATE
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.DELETE, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Optional: usage check (linked users)
      const linkedUsersCount = await ctx.prisma.user.count({
        where: { tenantId: ctx.tenantId, onboardingTemplateId: input.id },
      });
      if (linkedUsersCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This template is assigned to users. Detach them before deletion.",
        });
      }

      // With onDelete: Cascade, deleting the template is sufficient.
      return ctx.prisma.onboardingTemplate.delete({
        where: { id: input.id },
      });
    }),

  // -------------------------------------------------------
  // ADMIN — SET ACTIVE/INACTIVE
  // -------------------------------------------------------
  setActive: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.UPDATE, PermissionScope.GLOBAL)
      )
    )
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.onboardingTemplate.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
});
