/**
 * Email Template Management Router
 * Compatible with your Prisma EmailTemplate model
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";
import { Prisma } from "@prisma/client";

export const emailTemplateRouter = createTRPCRouter({
  // ----------------------------------------------------
  // LIST ALL TEMPLATES
  // ----------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.view))
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
    .use(hasPermission(PERMISSION_TREE_V2.settings.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
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
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(
      z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        category: z.string().min(1),

        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        textBody: z.string().optional(),

        description: z.string().optional(),
        variables: z.record(z.any()).optional(),

        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),
        styles: z.record(z.any()).optional(),

        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.emailTemplate.findFirst({
        where: {
          tenantId: ctx.tenantId!,
          name: input.name,
        },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this name already exists",
        });
      }

      const template = await ctx.prisma.emailTemplate.create({
        data: {
          tenantId: ctx.tenantId!,

          name: input.name,
          displayName: input.displayName,
          category: input.category,

          subject: input.subject,
          htmlBody: input.htmlBody,
          textBody: input.textBody ?? null,

          description: input.description ?? null,
          variables: input.variables ?? Prisma.JsonNull,
          headerHtml: input.headerHtml ?? null,
          footerHtml: input.footerHtml ?? null,
          styles: input.styles ?? Prisma.JsonNull,

          isActive: input.isActive,
          version: "1.0",
        },
      });

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // UPDATE TEMPLATE
  // ----------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(
      z.object({
        id: z.string(),

        displayName: z.string().optional(),
        category: z.string().optional(),

        subject: z.string().optional(),
        htmlBody: z.string().optional(),
        textBody: z.string().optional(),

        description: z.string().optional(),
        variables: z.record(z.any()).optional(),

        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),
        styles: z.record(z.any()).optional(),

        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const template = await ctx.prisma.emailTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId!,
        },
        data: {
          ...data,
          variables: data.variables ?? Prisma.JsonNull,
          styles: data.styles ?? Prisma.JsonNull,
        },
      });

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // DELETE TEMPLATE
  // ----------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.emailTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      return { success: true };
    }),

  // ----------------------------------------------------
  // PREVIEW TEMPLATE
  // ----------------------------------------------------
  preview: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.view))
    .input(
      z.object({
        id: z.string(),
        sampleData: z.record(z.any()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      let subject = template.subject;
      let html = template.htmlBody;
      let text = template.textBody ?? "";

      if (input.sampleData) {
        for (const [key, value] of Object.entries(input.sampleData)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          subject = subject.replace(regex, String(value));
          html = html.replace(regex, String(value));
          text = text.replace(regex, String(value));
        }
      }

      return {
        success: true,
        data: {
          subject,
          html,
          text,
          originalSubject: template.subject,
          originalHtml: template.htmlBody,
          originalText: template.textBody,
        },
      };
    }),

  // ----------------------------------------------------
  // DUPLICATE TEMPLATE
  // ----------------------------------------------------
  duplicate: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
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

          name: `${original.name}_copy_${Date.now()}`,
          displayName: `${original.displayName} (Copy)`,
          category: original.category,

          subject: original.subject,
          htmlBody: original.htmlBody,
          textBody: original.textBody ?? null,

          description: original.description,
          variables: original.variables ?? Prisma.JsonNull,
          headerHtml: original.headerHtml ?? null,
          footerHtml: original.footerHtml ?? null,
          styles: original.styles ?? Prisma.JsonNull,

          isActive: false,
          version: original.version,
        },
      });

      return { success: true, data: copy };
    }),

    // ----------------------------------------------------
    // GET AVAILABLE VARIABLES
    // ----------------------------------------------------
    getVariables: tenantProcedure
      .use(hasPermission(PERMISSION_TREE_V2.settings.view))
      .query(async () => {
        return [
          { key: "name", description: "User full name", example: "John Smith" },
          { key: "email", description: "User email address", example: "john@example.com" },
          { key: "company", description: "Company name", example: "Acme Inc." },
          { key: "date", description: "Current date", example: "2025-11-16" },
        ];
      }),
});
