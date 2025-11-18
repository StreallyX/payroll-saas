import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

import {
  buildPermissionKey,
  Resource,
  Action,
  PermissionScope,
} from "../../rbac/permissions-v2";

export const emailTemplateRouter = createTRPCRouter({

  // ----------------------------------------------------
  // LIST ALL TEMPLATES
  // ----------------------------------------------------
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.emailTemplate.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: templates };
    }),

  // ----------------------------------------------------
  // GET BY ID
  // ----------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // CREATE TEMPLATE
  // ----------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1), // HTML content
        variables: z.record(z.any()).optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.emailTemplate.findFirst({
        where: { tenantId: ctx.tenantId!, key: input.key },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this key already exists",
        });
      }

      const template = await ctx.prisma.emailTemplate.create({
        data: {
          tenantId: ctx.tenantId!,
          key: input.key,
          name: input.name,
          subject: input.subject,
          body: input.body,
          variables: input.variables ?? Prisma.JsonNull,
          isActive: input.isActive,
          createdBy: ctx.session.user.id,
        },
      });

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // UPDATE TEMPLATE
  // ----------------------------------------------------
  update: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.record(z.any()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updated = await ctx.prisma.emailTemplate.update({
        where: { id, tenantId: ctx.tenantId! },
        data: {
          ...data,
          variables: data.variables ?? Prisma.JsonNull,
        },
      });

      return { success: true, data: updated };
    }),

  // ----------------------------------------------------
  // DELETE TEMPLATE
  // ----------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.emailTemplate.delete({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      return { success: true };
    }),

  // ----------------------------------------------------
  // PREVIEW TEMPLATE
  // ----------------------------------------------------
  preview: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        id: z.string(),
        sampleData: z.record(z.any()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      let subject = template.subject;
      let body = template.body;

      if (input.sampleData) {
        for (const [key, value] of Object.entries(input.sampleData)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          subject = subject.replace(regex, String(value));
          body = body.replace(regex, String(value));
        }
      }

      return {
        success: true,
        data: {
          subject,
          body,
          originalSubject: template.subject,
          originalBody: template.body,
        },
      };
    }),

  // ----------------------------------------------------
  // DUPLICATE TEMPLATE
  // ----------------------------------------------------
  duplicate: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.emailTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      const copy = await ctx.prisma.emailTemplate.create({
        data: {
          tenantId: ctx.tenantId!,

          key: `${original.key}_copy_${Date.now()}`,
          name: `${original.name} (Copy)`,

          subject: original.subject,
          body: original.body,
          variables: original.variables ?? Prisma.JsonNull,

          isActive: false,
          createdBy: ctx.session.user.id,
        },
      });

      return { success: true, data: copy };
    }),

  // ----------------------------------------------------
  // AVAILABLE VARIABLES
  // ----------------------------------------------------
  getVariables: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.READ, PermissionScope.TENANT)
      )
    )
    .query(async () => {
      return [
        { key: "user_name", description: "Full name of the user", example: "John Doe" },
        { key: "company_name", description: "Company name", example: "Acme Inc." },
        { key: "date", description: "Current date", example: "2025-12-01" },
      ];
    }),
});
