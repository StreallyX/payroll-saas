/**
 * PDF Template Management Router
 * Fully compatible with Prisma PDFTemplate model
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";

export const pdfTemplateRouter = createTRPCRouter({
  // ----------------------------------------------------
  // LIST ALL PDF TEMPLATES
  // ----------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.view))
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.pDFTemplate.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: templates };
    }),

  // ----------------------------------------------------
  // GET ONE PDF TEMPLATE
  // ----------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.pDFTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PDF template not found",
        });
      }

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // CREATE PDF TEMPLATE
  // ----------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(
      z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        type: z.string().min(1), // contract, invoice, payslip, report

        template: z.string().min(1), // HTML with handlebars
        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),

        styles: z.record(z.any()).optional(),
        margins: z.record(z.any()).optional(),

        description: z.string().optional(),

        pageSize: z.enum(["A4", "LETTER", "LEGAL"]).default("A4"),
        orientation: z.enum(["portrait", "landscape"]).default("portrait"),

        watermarkText: z.string().optional(),
        watermarkOpacity: z.number().optional(),

        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.pDFTemplate.findFirst({
        where: { tenantId: ctx.tenantId!, name: input.name },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A PDF template with this name already exists",
        });
      }

      const template = await ctx.prisma.pDFTemplate.create({
        data: {
          tenantId: ctx.tenantId!,

          name: input.name,
          displayName: input.displayName,
          type: input.type,

          template: input.template,
          headerHtml: input.headerHtml ?? null,
          footerHtml: input.footerHtml ?? null,

          styles: input.styles ?? Prisma.JsonNull,
          margins: input.margins ?? Prisma.JsonNull,

          description: input.description ?? null,

          pageSize: input.pageSize,
          orientation: input.orientation,

          watermarkText: input.watermarkText ?? null,
          watermarkOpacity: input.watermarkOpacity ?? 0.3,

          version: "1.0",
          isActive: input.isActive,
        },
      });

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // UPDATE PDF TEMPLATE
  // ----------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(
      z.object({
        id: z.string(),

        displayName: z.string().optional(),
        type: z.string().optional(),

        template: z.string().optional(),
        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),

        styles: z.record(z.any()).optional(),
        margins: z.record(z.any()).optional(),

        description: z.string().optional(),

        pageSize: z.enum(["A4", "LETTER", "LEGAL"]).optional(),
        orientation: z.enum(["portrait", "landscape"]).optional(),

        watermarkText: z.string().optional(),
        watermarkOpacity: z.number().optional(),

        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const template = await ctx.prisma.pDFTemplate.update({
        where: { id, tenantId: ctx.tenantId! },
        data: {
          ...data,
          styles: data.styles ?? Prisma.JsonNull,
          margins: data.margins ?? Prisma.JsonNull,
        },
      });

      return { success: true, data: template };
    }),

  // ----------------------------------------------------
  // DELETE PDF TEMPLATE
  // ----------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pDFTemplate.delete({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      return { success: true };
    }),

  // ----------------------------------------------------
  // PREVIEW PDF TEMPLATE
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
      const template = await ctx.prisma.pDFTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PDF template not found",
        });
      }

      let html = template.template;
      let header = template.headerHtml ?? "";
      let footer = template.footerHtml ?? "";

      if (input.sampleData) {
        for (const [key, value] of Object.entries(input.sampleData)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          html = html.replace(regex, String(value));
          header = header.replace(regex, String(value));
          footer = footer.replace(regex, String(value));
        }
      }

      return {
        success: true,
        data: {
          html,
          header,
          footer,
          originalHtml: template.template,
          originalHeader: template.headerHtml,
          originalFooter: template.footerHtml,
          pageSize: template.pageSize,
          orientation: template.orientation,
          styles: template.styles,
        },
      };
    }),

  // ----------------------------------------------------
  // DUPLICATE PDF TEMPLATE
  // ----------------------------------------------------
  duplicate: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.settings.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.pDFTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PDF template not found",
        });
      }

      const copy = await ctx.prisma.pDFTemplate.create({
        data: {
          tenantId: ctx.tenantId!,

          name: `${original.name}_copy_${Date.now()}`,
          displayName: `${original.displayName} (Copy)`,
          type: original.type,

          template: original.template,
          headerHtml: original.headerHtml,
          footerHtml: original.footerHtml,

          styles: original.styles ?? Prisma.JsonNull,
          margins: original.margins ?? Prisma.JsonNull,

          description: original.description,
          pageSize: original.pageSize,
          orientation: original.orientation,

          watermarkText: original.watermarkText,
          watermarkOpacity: original.watermarkOpacity,

          version: original.version,
          isActive: false,
        },
      });

      return { success: true, data: copy };
    }),

    // ----------------------------------------------------
    // GET AVAILABLE PDF VARIABLES
    // ----------------------------------------------------
    getVariables: tenantProcedure
      .use(hasPermission(PERMISSION_TREE_V2.settings.view))
      .query(async () => {
        return [
          { key: "user_name", description: "Full name of the user", example: "John Doe" },
          { key: "company_name", description: "Company name", example: "Acme Corporation" },
          { key: "date", description: "Current date", example: "2025-01-01" },
          { key: "contract_id", description: "Contract identifier", example: "CNT-19392" },
        ];
      }),
});
