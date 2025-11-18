import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const documentRouter = createTRPCRouter({

  // ------------------------------------------------------------------
  // GET ALL DOCUMENTS
  // ------------------------------------------------------------------
  getAll: tenantProcedure
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.view_all");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const where: any = {
        tenantId: ctx.tenantId,
        isActive: true,
        isLatestVersion: true,
      };

      if (input?.entityType) where.entityType = input.entityType;
      if (input?.entityId) where.entityId = input.entityId;
      if (input?.category) where.category = input.category;

      const [documents, total] = await Promise.all([
        ctx.prisma.document.findMany({
          where,
          orderBy: { uploadedAt: "desc" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.document.count({ where }),
      ]);

      return {
        documents,
        total,
        hasMore: (input?.offset ?? 0) + documents.length < total,
      };
    }),

  // ------------------------------------------------------------------
  // GET BY ID
  // ------------------------------------------------------------------
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.view_all");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          parentDocument: true,
          versions: { orderBy: { version: "desc" } },
        },
      });

      if (!document)
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      return document;
    }),

  // ------------------------------------------------------------------
  // GET BY ENTITY
  // ------------------------------------------------------------------
  getByEntity: tenantProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.view_all");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.document.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
          isActive: true,
          isLatestVersion: true,
        },
        orderBy: { uploadedAt: "desc" },
      });
    }),

  // ------------------------------------------------------------------
  // CREATE DOCUMENT
  // ------------------------------------------------------------------
  create: tenantProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      category: z.string().optional(),
      visibility: z.enum(["private", "tenant", "public"]).default("private"),
      requiresSignature: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.update");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.document.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          uploadedById: ctx.session.user.id,
        },
      });
    }),

  // ------------------------------------------------------------------
  // UPDATE DOCUMENT
  // ------------------------------------------------------------------
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      visibility: z.enum(["private", "tenant", "public"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.update");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: input,
      });
    }),

  // ------------------------------------------------------------------
  // SOFT DELETE
  // ------------------------------------------------------------------
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.update");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // ------------------------------------------------------------------
  // CREATE VERSION
  // ------------------------------------------------------------------
  createVersion: tenantProcedure
    .input(z.object({
      parentDocumentId: z.string(),
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.update");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const parent = await ctx.prisma.document.findFirst({
        where: { id: input.parentDocumentId, tenantId: ctx.tenantId },
      });

      if (!parent) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.document.update({
        where: { id: parent.id },
        data: { isLatestVersion: false },
      });

      return ctx.prisma.document.create({
        data: {
          name: parent.name,
          description: parent.description,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          entityType: parent.entityType,
          entityId: parent.entityId,
          category: parent.category,
          visibility: parent.visibility,
          version: parent.version + 1,
          isLatestVersion: true,
          parentDocumentId: parent.id,
          tenantId: ctx.tenantId,
          uploadedById: ctx.session.user.id,
        },
      });
    }),

  // ------------------------------------------------------------------
  // SIGN DOCUMENT
  // ------------------------------------------------------------------
  sign: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.update");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      if (!document.requiresSignature)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Document does not require signature" });

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: {
          isSigned: true,
          signedAt: new Date(),
          signedBy: ctx.session.user.id,
        },
      });
    }),

  // ------------------------------------------------------------------
  // VERSION HISTORY
  // ------------------------------------------------------------------
  getVersionHistory: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {

      const hasPermission =
        ctx.session.user.isSuperAdmin ||
        ctx.session.user.permissions.includes("contracts.manage.view_all");

      if (!hasPermission) throw new TRPCError({ code: "FORBIDDEN" });

      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      const rootId = document.parentDocumentId || document.id;

      return ctx.prisma.document.findMany({
        where: {
          OR: [
            { id: rootId },
            { parentDocumentId: rootId },
          ],
          tenantId: ctx.tenantId,
        },
        orderBy: { version: "desc" },
      });
    }),
});
