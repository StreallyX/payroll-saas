import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";
import { TRPCError } from "@trpc/server";

export const documentRouter = createTRPCRouter({
  // ---------------------------------------------------------
  // GET OWN DOCUMENTS (Contractors can view their own)
  // ---------------------------------------------------------
  getOwn: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.profile.documents.view))
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Get documents uploaded by the user or associated with their user ID
      const where: any = { 
        tenantId: ctx.tenantId, 
        isActive: true, 
        isLatestVersion: true,
        OR: [
          { uploadedById: ctx.session.user.id },
          { entityType: "user", entityId: ctx.session.user.id },
        ]
      };
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

      return { documents, total, hasMore: (input?.offset ?? 0) + documents.length < total };
    }),

  // ---------------------------------------------------------
  // UPLOAD OWN DOCUMENT
  // ---------------------------------------------------------
  uploadOwn: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.profile.documents.upload))
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.document.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          uploadedById: ctx.session.user.id,
          entityType: "user",
          entityId: ctx.session.user.id,
          visibility: "private",
        },
      });
    }),

  // ---------------------------------------------------------
  // DELETE OWN DOCUMENT
  // ---------------------------------------------------------
  deleteOwn: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.profile.documents.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user can only delete their own documents
      const document = await ctx.prisma.document.findFirst({
        where: { 
          id: input.id, 
          tenantId: ctx.tenantId,
          uploadedById: ctx.session.user.id,
        },
      });

      if (!document) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Document not found or you don't have permission to delete it" 
        });
      }

      // Soft delete by marking as inactive
      return ctx.prisma.document.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // ---------------------------------------------------------
  // GET ALL DOCUMENTS (ADMIN)
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId, isActive: true, isLatestVersion: true };
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

      return { documents, total, hasMore: (input?.offset ?? 0) + documents.length < total };
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          parentDocument: true,
          versions: {
            orderBy: { version: "desc" },
          },
        },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      return document;
    }),

  getByEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
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

  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
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
      return ctx.prisma.document.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          uploadedById: ctx.session.user.id,
        },
      });
    }),

  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      visibility: z.enum(["private", "tenant", "public"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const document = await ctx.prisma.document.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.update({
        where: { id },
        data,
      });
    }),

  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  createVersion: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(z.object({
      parentDocumentId: z.string(),
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.document.findFirst({
        where: { id: input.parentDocumentId, tenantId: ctx.tenantId },
      });
      if (!parent) throw new TRPCError({ code: "NOT_FOUND" });

      // Mark parent as not latest version
      await ctx.prisma.document.update({
        where: { id: parent.id },
        data: { isLatestVersion: false },
      });

      // Create new version
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

  sign: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });
      if (!document.requiresSignature) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Document does not require signature" });
      }

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: {
          isSigned: true,
          signedAt: new Date(),
          signedBy: ctx.session.user.id,
        },
      });
    }),

  getVersionHistory: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.manage.view_all))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      // Get all versions (both ancestors and descendants)
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
