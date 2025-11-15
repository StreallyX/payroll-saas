import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE } from "../../rbac/permissions"

export const documentTypeRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL — Tenant Only
  // -------------------------------------------------------
  getAll: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.documentType.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: "asc" },
    })
  }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.documentType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })
    }),

  // -------------------------------------------------------
  // CREATE DOCUMENT TYPE
  // Requires: document_types.create
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.documentTypes.create))
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isRequired: z.boolean().default(false),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {

      // Check duplicate name
      const existing = await ctx.prisma.documentType.findFirst({
        where: {
          name: input.name,
          tenantId: ctx.tenantId,
        },
      })

      if (existing) {
        throw new Error("A document type with this name already exists.")
      }

      const docType = await ctx.prisma.documentType.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: docType.id,
        entityName: docType.name,
        metadata: {
          name: docType.name,
          isRequired: docType.isRequired,
        },
        tenantId: ctx.tenantId,
      })

      return docType
    }),

  // -------------------------------------------------------
  // UPDATE DOCUMENT TYPE
  // Requires: document_types.update
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.documentTypes.update))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isRequired: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const before = await ctx.prisma.documentType.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      const docType = await ctx.prisma.documentType.update({
        where: { id },
        data: updateData,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: docType.id,
        entityName: before?.name ?? "Document Type",
        metadata: {
          changes: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return docType
    }),

  // -------------------------------------------------------
  // DELETE DOCUMENT TYPE
  // Requires: document_types.delete
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.documentTypes.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const before = await ctx.prisma.documentType.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      const deleted = await ctx.prisma.documentType.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: input.id,
        entityName: before?.name ?? "Document Type",
        metadata: {
          name: before?.name,
        },
        tenantId: ctx.tenantId,
      })

      return deleted
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const total = await ctx.prisma.documentType.count({
      where: { tenantId: ctx.tenantId },
    })

    const required = await ctx.prisma.documentType.count({
      where: { tenantId: ctx.tenantId, isRequired: true },
    })

    const active = await ctx.prisma.documentType.count({
      where: { tenantId: ctx.tenantId, isActive: true },
    })

    return {
      total,
      required,
      active,
      optional: total - required,
    }
  }),
})
