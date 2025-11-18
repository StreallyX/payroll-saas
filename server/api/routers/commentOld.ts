import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({

  // ------------------------------------------------------
  // GET ALL COMMENTS
  // ------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission("comment.read.global"))
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { 
        tenantId: ctx.tenantId, 
        isDeleted: false, 
        parentCommentId: null 
      };

      if (input?.entityType) where.entityType = input.entityType;
      if (input?.entityId) where.entityId = input.entityId;

      return ctx.prisma.comment.findMany({
        where,
        include: {
          author: { select: { name: true, email: true } },
          replies: {
            include: {
              author: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ------------------------------------------------------
  // GET ONE COMMENT
  // ------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission("comment.read.global"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          author: { select: { name: true, email: true } },
          replies: {
            include: {
              author: { select: { name: true, email: true } },
            },
          },
        },
      });

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      return comment;
    }),

  // ------------------------------------------------------
  // GET COMMENTS BY ENTITY
  // ------------------------------------------------------
  getByEntity: tenantProcedure
    .use(hasPermission("comment.read.global"))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.comment.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
          isDeleted: false,
          parentCommentId: null,
        },
        include: {
          author: { select: { name: true, email: true } },
          replies: {
            where: { isDeleted: false },
            include: {
              author: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ------------------------------------------------------
  // CREATE COMMENT
  // ------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission("comment.create.global"))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      content: z.string().min(1),
      parentCommentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.comment.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          authorId: ctx.session.user.id,
          authorName: ctx.session.user.name || ctx.session.user.email,
        },
        include: {
          author: { select: { name: true, email: true } },
        },
      });
    }),

  // ------------------------------------------------------
  // UPDATE COMMENT
  // ------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission("comment.update.global"))
    .input(z.object({
      id: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findFirst({
        where: { 
          id: input.id, 
          tenantId: ctx.tenantId,
          authorId: ctx.session.user.id, // only owner
        },
      });

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.comment.update({
        where: { id: input.id },
        data: { 
          content: input.content,
          isEdited: true,
        },
      });
    }),

  // ------------------------------------------------------
  // DELETE COMMENT
  // ------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission("comment.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findFirst({
        where: { 
          id: input.id, 
          tenantId: ctx.tenantId,
          authorId: ctx.session.user.id,
        },
      });

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.comment.update({
        where: { id: input.id },
        data: { isDeleted: true },
      });
    }),

  // ------------------------------------------------------
  // GET REPLIES
  // ------------------------------------------------------
  getReplies: tenantProcedure
    .use(hasPermission("comment.read.global"))
    .input(z.object({ commentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.comment.findMany({
        where: {
          parentCommentId: input.commentId,
          tenantId: ctx.tenantId,
          isDeleted: false,
        },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),
});
