import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";

export const tagRouter = createTRPCRouter({
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId };
      if (input?.category) where.category = input.category;
      if (input?.isActive !== undefined) where.isActive = input.isActive;

      return ctx.prisma.tag.findMany({
        where,
        orderBy: [{ usageCount: "desc" }, { name: "asc" }],
      });
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });
      return tag;
    }),

  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      color: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.tag.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const tag = await ctx.prisma.tag.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.tag.update({
        where: { id },
        data,
      });
    }),

  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
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

  assignToEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
    .input(z.object({
      tagId: z.string(),
      entityType: z.string(),
      entityId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: { id: input.tagId, tenantId: ctx.tenantId },
      });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });

      const assignment = await ctx.prisma.tagAssignment.create({
        data: {
          tenantId: ctx.tenantId,
          tagId: input.tagId,
          entityType: input.entityType,
          entityId: input.entityId,
          assignedById: ctx.session.user.id,
        },
      });

      // Update tag usage count
      await ctx.prisma.tag.update({
        where: { id: input.tagId },
        data: {
          usageCount: { increment: 1 },
        },
      });

      return assignment;
    }),

  removeFromEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.manage))
    .input(z.object({
      tagId: z.string(),
      entityType: z.string(),
      entityId: z.string(),
    }))
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

      // Update tag usage count
      await ctx.prisma.tag.update({
        where: { id: input.tagId },
        data: {
          usageCount: { decrement: 1 },
        },
      });

      return { success: true };
    }),

  getByEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.contracts.view))
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
