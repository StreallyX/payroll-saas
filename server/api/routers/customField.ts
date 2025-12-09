import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const customFieldRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL FIELDS
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission("contracts.manage.view_all"))
    .input(z.object({
      entityType: z.string().optional(),
      isRequired: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId };
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.isRequired !== undefined) where.isRequired = input.isRequired;

      return ctx.prisma.customField.findMany({
        where,
        orderBy: { fieldLabel: "asc" },
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission("contracts.manage.view_all"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const field = await ctx.prisma.customField.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!field) throw new TRPCError({ code: "NOT_FOUND" });
      return field;
    }),

  // -------------------------------------------------------
  // GET BY ENTITY TYPE
  // -------------------------------------------------------
  getByEntityType: tenantProcedure
    .use(hasPermission("contracts.manage.view_all"))
    .input(z.object({ entityType: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customField.findMany({
        where: {
          entityType: input.entityType,
          tenantId: ctx.tenantId,
        },
        orderBy: { fieldLabel: "asc" },
      });
    }),

  // -------------------------------------------------------
  // CREATE FIELD
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission("tenant.settings.custom_fields.manage"))
    .input(z.object({
      entityType: z.string(),
      fieldName: z.string(),
      fieldLabel: z.string(),
      fieldType: z.enum(["text", "number", "date", "boolean", "select", "multi_select"]),
      isRequired: z.boolean().default(false),
      options: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customField.create({
        data: {
          tenantId: ctx.tenantId,
          createdBy: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // -------------------------------------------------------
  // UPDATE FIELD
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission("tenant.settings.custom_fields.manage"))
    .input(z.object({
      id: z.string(),
      fieldLabel: z.string().optional(),
      isRequired: z.boolean().optional(),
      options: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.customField.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.customField.update({
        where: { id },
        data,
      });
    }),

  // -------------------------------------------------------
  // DELETE FIELD
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission("tenant.settings.custom_fields.manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customField.delete({
        where: { id: input.id },
      });
    }),

  // -------------------------------------------------------
  // SET VALUE
  // -------------------------------------------------------
  setValue: tenantProcedure
    .use(hasPermission("contracts.manage.update"))
    .input(z.object({
      customFieldId: z.string(),
      entityType: z.string(),
      entityId: z.string(),
      value: z.any(), // JSON
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customFieldValue.upsert({
        where: {
          customFieldId_entityType_entityId: {
            customFieldId: input.customFieldId,
            entityType: input.entityType,
            entityId: input.entityId,
          },
        },
        create: {
          tenantId: ctx.tenantId,
          customFieldId: input.customFieldId,
          entityType: input.entityType,
          entityId: input.entityId,
          createdBy: ctx.session.user.id,
          value: input.value,
        },
        update: {
          value: input.value,
        },
      });
    }),

  // -------------------------------------------------------
  // GET A SINGLE VALUE
  // -------------------------------------------------------
  getValue: tenantProcedure
    .use(hasPermission("contracts.manage.view_all"))
    .input(z.object({
      customFieldId: z.string(),
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customFieldValue.findFirst({
        where: {
          customFieldId: input.customFieldId,
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: { customField: true },
      });
    }),

  // -------------------------------------------------------
  // GET ALL VALUES FOR ENTITY
  // -------------------------------------------------------
  getValuesByEntity: tenantProcedure
    .use(hasPermission("contracts.manage.view_all"))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customFieldValue.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: { customField: true },
      });
    }),
});
