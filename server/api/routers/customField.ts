import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";

export const customFieldRouter = createTRPCRouter({
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({
      entityType: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId };
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.isActive !== undefined) where.isActive = input.isActive;

      return ctx.prisma.customField.findMany({
        where,
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const field = await ctx.prisma.customField.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });
      return field;
    }),

  getByEntityType: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ entityType: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customField.findMany({
        where: {
          entityType: input.entityType,
          tenantId: ctx.tenantId,
          isActive: true,
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    }),

  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.manage))
    .input(z.object({
      name: z.string().min(1),
      key: z.string().min(1),
      fieldType: z.enum(["text", "number", "date", "boolean", "select", "multi_select"]),
      entityType: z.string(),
      isRequired: z.boolean().default(false),
      options: z.record(z.any()).optional(),
      validationRules: z.record(z.any()).optional(),
      order: z.number().default(0),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customField.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.manage))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      isRequired: z.boolean().optional(),
      isActive: z.boolean().optional(),
      options: z.record(z.any()).optional(),
      validationRules: z.record(z.any()).optional(),
      order: z.number().optional(),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const field = await ctx.prisma.customField.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.customField.update({
        where: { id },
        data,
      });
    }),

  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.manage))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const field = await ctx.prisma.customField.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.customField.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),

  setValue: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
    .input(z.object({
      customFieldId: z.string(),
      entityType: z.string(),
      entityId: z.string(),
      textValue: z.string().optional(),
      numberValue: z.number().optional(),
      dateValue: z.date().optional(),
      booleanValue: z.boolean().optional(),
      jsonValue: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const field = await ctx.prisma.customField.findFirst({
        where: { id: input.customFieldId, tenantId: ctx.tenantId },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.customFieldValue.upsert({
        where: {
          customFieldId_entityType_entityId: {
            customFieldId: input.customFieldId,
            entityType: input.entityType,
            entityId: input.entityId,
          },
        },
        create: {
          customFieldId: input.customFieldId,
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
          createdById: ctx.session.user.id,
          textValue: input.textValue,
          numberValue: input.numberValue,
          dateValue: input.dateValue,
          booleanValue: input.booleanValue,
          jsonValue: input.jsonValue,
        },
        update: {
          textValue: input.textValue,
          numberValue: input.numberValue,
          dateValue: input.dateValue,
          booleanValue: input.booleanValue,
          jsonValue: input.jsonValue,
        },
      });
    }),

  getValue: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
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
        include: {
          customField: true,
        },
      });
    }),

  getValuesByEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
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
        include: {
          customField: true,
        },
      });
    }),
});
