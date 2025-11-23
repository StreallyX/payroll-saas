import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";

const VIEW = buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.GLOBAL);
const LIST = buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL);
const UPDATE = buildPermissionKey(Resource.CONTRACT, Action.UPDATE, PermissionScope.GLOBAL);

export const tagRouter = createTRPCRouter({

  // ---------------------------
  // GET ALL TAGS
  // ---------------------------
  getAll: tenantProcedure
    .use(hasPermission(LIST))
    .input(
      z.object({
        isActive: z.boolean().optional(), // ⚠️ ton modèle n'a pas isActive, donc je ne filtre pas dessus
      }).optional()
    )
    .query(async ({ ctx }) => {
      return ctx.prisma.tag.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { name: "asc" },
      });
    }),

  // ---------------------------
  // GET ONE
  // ---------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });

      return tag;
    }),

  // ---------------------------
  // CREATE TAG
  // ---------------------------
  create: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.tag.create({
        data: {
          name: input.name,
          color: input.color ?? "#3b82f6",
          tenantId: ctx.tenantId,
          createdBy: ctx.session.user.id,
        },
      });
    }),

  // ---------------------------
  // UPDATE TAG
  // ---------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.tag.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.tag.update({
        where: { id },
        data,
      });
    }),

  // ---------------------------
  // DELETE TAG
  // ---------------------------
  delete: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.tag.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------
  // ASSIGN TAG
  // ---------------------------
  assignToEntity: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        tagId: z.string(),
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.tagAssignment.create({
        data: {
          tenantId: ctx.tenantId,
          tagId: input.tagId,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      });
    }),

  // ---------------------------
  // REMOVE TAG ASSIGNMENT
  // ---------------------------
  removeFromEntity: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        tagId: z.string(),
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tagAssignment.findFirst({
        where: {
          tagId: input.tagId,
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
      });

      if (!assignment) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.tagAssignment.delete({
        where: { id: assignment.id },
      });

      return { success: true };
    }),

  // ---------------------------
  // GET TAGS FOR ENTITY
  // ---------------------------
  getByEntity: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.prisma.tagAssignment.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: {
          tag: true,
        },
      });

      return assignments.map(a => a.tag);
    }),

});
