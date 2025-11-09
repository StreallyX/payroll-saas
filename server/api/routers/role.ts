

import { z } from "zod"
import { createTRPCRouter, tenantProcedure, adminProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const roleRouter = createTRPCRouter({
  // Get all roles for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.role.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: "asc" },
      })
    }),

  // Get role by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.role.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          _count: {
            select: { users: true }
          }
        },
      })
    }),

  // Create role
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if role with this name already exists
      const existingRole = await ctx.prisma.role.findFirst({
        where: {
          name: input.name,
          tenantId: ctx.tenantId,
        },
      })

      if (existingRole) {
        throw new Error("Un rôle avec ce nom existe déjà")
      }

      const newRole = await ctx.prisma.role.create({
        data: {
          name: input.name,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.ROLE,
        entityId: newRole.id,
        entityName: newRole.name,
        metadata: {
          name: newRole.name,
        },
        tenantId: ctx.tenantId,
      })

      return newRole
    }),

  // Update role
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Get current role data for audit log
      const currentRole = await ctx.prisma.role.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      const updatedRole = await ctx.prisma.role.update({
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
        entityType: AuditEntityType.ROLE,
        entityId: updatedRole.id,
        entityName: currentRole?.name || "Role",
        metadata: {
          changes: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return updatedRole
    }),

  // Delete role
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get role data before deletion for audit log
      const roleToDelete = await ctx.prisma.role.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { name: true },
      })

      // Check if role has users
      const userCount = await ctx.prisma.user.count({
        where: { roleId: input.id },
      })

      if (userCount > 0) {
        throw new Error(`Ce rôle ne peut pas être supprimé car ${userCount} utilisateur(s) l'utilisent encore`)
      }

      const deletedRole = await ctx.prisma.role.delete({
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
        entityType: AuditEntityType.ROLE,
        entityId: input.id,
        entityName: roleToDelete?.name || "Role",
        metadata: {
          name: roleToDelete?.name,
        },
        tenantId: ctx.tenantId,
      })

      return deletedRole
    }),

  // Get stats
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.role.count({
        where: { tenantId: ctx.tenantId },
      })

      const withUsers = await ctx.prisma.role.count({
        where: {
          tenantId: ctx.tenantId,
          users: {
            some: {}
          }
        },
      })

      const withoutUsers = total - withUsers

      return {
        total,
        withUsers,
        withoutUsers,
      }
    }),
})
