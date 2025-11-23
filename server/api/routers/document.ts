import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasAnyPermission,
  hasPermission,
} from "../trpc";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";

import { uploadFileToS3, deleteFromS3, getSignedUrlForKey } from "@/lib/s3";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";

// ====================================================================
// PERMISSIONS
// ====================================================================
const READ_OWN       = buildPermissionKey(Resource.DOCUMENT, Action.READ, PermissionScope.OWN);
const READ_GLOBAL    = buildPermissionKey(Resource.DOCUMENT, Action.READ, PermissionScope.GLOBAL);

const LIST_GLOBAL    = buildPermissionKey(Resource.DOCUMENT, Action.LIST, PermissionScope.GLOBAL);

const UPLOAD_OWN     = buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.OWN);
const UPLOAD_GLOBAL  = buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.GLOBAL);

const UPDATE_OWN     = buildPermissionKey(Resource.DOCUMENT, Action.UPDATE, PermissionScope.OWN);
const UPDATE_GLOBAL  = buildPermissionKey(Resource.DOCUMENT, Action.UPDATE, PermissionScope.GLOBAL);

const DELETE_OWN     = buildPermissionKey(Resource.DOCUMENT, Action.DELETE, PermissionScope.OWN);
const DELETE_GLOBAL  = buildPermissionKey(Resource.DOCUMENT, Action.DELETE, PermissionScope.GLOBAL);

// ====================================================================
// ROUTER
// ====================================================================
export const documentRouter = createTRPCRouter({

  // ================================================================
  // LIST DOCUMENTS (STYLE DEEL)
  // ================================================================
  list: tenantProcedure
    .use(hasAnyPermission([LIST_GLOBAL, READ_OWN, READ_GLOBAL]))
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        latestOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const permissions = ctx.session.user.permissions ?? [];

      const canGlobalList  = permissions.includes(LIST_GLOBAL);
      const canReadGlobal  = permissions.includes(READ_GLOBAL);

      let where: any = {
        tenantId: ctx.tenantId,
        ...(input.entityType && input.entityId
          ? { entityType: input.entityType, entityId: input.entityId }
          : {}),
        ...(input.latestOnly ? { isLatestVersion: true } : {}),
      };

      if (!canGlobalList && !canReadGlobal) {
        where.uploadedBy = userId;
      }

      return ctx.prisma.document.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
      });
    }),

  // ================================================================
  // GET SIGNED URL (DOWNLOAD / VIEW)
  // ================================================================
  getSignedUrl: tenantProcedure
    .use(hasAnyPermission([READ_OWN, READ_GLOBAL, LIST_GLOBAL]))
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: {
          id: input.documentId,
          tenantId: ctx.tenantId,
        },
      });

      if (!doc) throw new Error("Document not found.");

      const url = await getSignedUrlForKey(doc.s3Key);

      return { url };
    }),

  // ================================================================
  // UPLOAD — VERSION 1
  // ================================================================
  upload: tenantProcedure
    .use(hasAnyPermission([UPLOAD_OWN, UPLOAD_GLOBAL]))
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        buffer: z.string(), // base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.buffer, "base64");

      const s3Key = `tenant_${ctx.tenantId}/${input.entityType}/${input.entityId}/v1/${input.fileName}`;

      await uploadFileToS3(s3Key, buffer, input.mimeType);

      const doc = await ctx.prisma.document.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: input.entityType,
          entityId: input.entityId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploadedBy: ctx.session.user.id,
          s3Key,
          version: 1,
          isLatestVersion: true,
        },
      });

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name!,
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.DOCUMENT,
        entityId: doc.id,
        entityName: doc.fileName,
        metadata: {},
        tenantId: ctx.tenantId,
      });

      return doc;
    }),

  // ================================================================
  // CREATE NEW VERSION (v+1)
  // ================================================================
  updateVersion: tenantProcedure
    .use(hasAnyPermission([UPDATE_OWN, UPDATE_GLOBAL]))
    .input(
      z.object({
        documentId: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        buffer: z.string(), // base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldDoc = await ctx.prisma.document.findFirst({
        where: { id: input.documentId, tenantId: ctx.tenantId },
      });

      if (!oldDoc) throw new Error("Document not found.");

      const nextVersion = oldDoc.version + 1;
      const buffer = Buffer.from(input.buffer, "base64");

      const s3Key = `tenant_${ctx.tenantId}/${oldDoc.entityType}/${oldDoc.entityId}/v${nextVersion}/${input.fileName}`;

      await uploadFileToS3(s3Key, buffer, input.mimeType);

      await ctx.prisma.document.update({
        where: { id: oldDoc.id },
        data: { isLatestVersion: false },
      });

      const newDoc = await ctx.prisma.document.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: oldDoc.entityType,
          entityId: oldDoc.entityId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          s3Key,
          version: nextVersion,
          isLatestVersion: true,
          parentDocumentId: oldDoc.id,
          uploadedBy: ctx.session.user.id,
        },
      });

      return newDoc;
    }),

  // ================================================================
  // DELETE DOCUMENT
  // ================================================================
  delete: tenantProcedure
    .use(hasAnyPermission([DELETE_OWN, DELETE_GLOBAL]))
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.documentId, tenantId: ctx.tenantId },
      });

      if (!doc) throw new Error("Document not found.");

      await deleteFromS3(doc.s3Key);

      await ctx.prisma.document.delete({ where: { id: doc.id } });

      return { success: true };
    }),

  // ================================================================
  // LIST VERSIONS OF A DOCUMENT
  // ================================================================
  listVersions: tenantProcedure
    .use(hasAnyPermission([READ_OWN, READ_GLOBAL, LIST_GLOBAL]))
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.documentId, tenantId: ctx.tenantId },
      });

      if (!doc) throw new Error("Document not found.");

      return ctx.prisma.document.findMany({
        where: {
          OR: [
            { id: doc.id },
            { parentDocumentId: doc.id },
          ],
        },
        orderBy: { version: "desc" },
      });
    }),
});
