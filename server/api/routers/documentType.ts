

import { z } from "zod"
import { createTRPCRouter, tenantProcedure, adminProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const documentTypeRouter = createTRPCRouter({
  // Get all document types for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.documentType.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { name: "asc" },
      })
    }),

  // Get document type by ID
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

  // Create document type
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isRequired: z.boolean().default(false),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if document type with this name already exists
      const existingDocType = await ctx.prisma.documentType.findFirst({
        where: {
          name: input.name,
          tenantId: ctx.tenantId,
        },
      })

      if (existingDocType) {
        throw new Error("Un type de document avec ce nom existe déjà")
      }

      const newDocType = await ctx.prisma.documentType.create({
        data: {
          name: input.name,
          description: input.description,
          isRequired: input.isRequired,
          isActive: input.isActive,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: newDocType.id,
        entityName: newDocType.name,
        metadata: {
          name: newDocType.name,
          isRequired: newDocType.isRequired,
        },
        tenantId: ctx.tenantId,
      })

      return newDocType
    }),

  // Update document type
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isRequired: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Get current document type data for audit log
      const currentDocType = await ctx.prisma.documentType.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      const updatedDocType = await ctx.prisma.documentType.update({
        where: { 
          id,
        },
        data: updateData,
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: updatedDocType.id,
        entityName: currentDocType?.name || "Document Type",
        metadata: {
          changes: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return updatedDocType
    }),

  // Delete document type
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get document type data before deletion for audit log
      const docTypeToDelete = await ctx.prisma.documentType.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      const deletedDocType = await ctx.prisma.documentType.delete({
        where: { 
          id: input.id,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.DOCUMENT_TYPE,
        entityId: input.id,
        entityName: docTypeToDelete?.name || "Document Type",
        metadata: {
          name: docTypeToDelete?.name,
        },
        tenantId: ctx.tenantId,
      })

      return deletedDocType
    }),

  // Get stats
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.documentType.count({
        where: { tenantId: ctx.tenantId },
      })

      const required = await ctx.prisma.documentType.count({
        where: {
          tenantId: ctx.tenantId,
          isRequired: true,
        },
      })

      const active = await ctx.prisma.documentType.count({
        where: {
          tenantId: ctx.tenantId,
          isActive: true,
        },
      })

      return {
        total,
        required,
        active,
        optional: total - required,
      }
    }),
})
