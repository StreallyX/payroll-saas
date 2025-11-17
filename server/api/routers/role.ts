import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";

export const roleRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL ROLES
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.view))
    .query(async ({ ctx }) => {
      return ctx.prisma.role.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          _count: { select: { users: true } },
          rolePermissions: {
            include: {
              permission: true
            }
          }
        },
        orderBy: { name: "asc" },
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.role.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          _count: { select: { users: true } },
          rolePermissions: {
            include: {
              permission: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true
            }
          }
        },
      });
    }),

  // -------------------------------------------------------
  // CREATE ROLE
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.create))
    .input(z.object({
      name: z.string().min(1),
      homePath: z.string().default("/admin"),
      permissionIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const existing = await ctx.prisma.role.findFirst({
        where: { name: input.name, tenantId: ctx.tenantId },
      });

      if (existing) {
        throw new Error("A role with this name already exists.");
      }

      const role = await ctx.prisma.role.create({
        data: {
          name: input.name,
          homePath: input.homePath,
          tenantId: ctx.tenantId,
        },
      });

      // Assign permissions if provided
      if (input.permissionIds && input.permissionIds.length > 0) {
        await ctx.prisma.rolePermission.createMany({
          data: input.permissionIds.map(permissionId => ({
            roleId: role.id,
            permissionId
          }))
        });
      }

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.ROLE,
        entityId: role.id,
        entityName: role.name,
        metadata: { name: role.name, permissionIds: input.permissionIds },
        tenantId: ctx.tenantId,
      });

      return role;
    }),

  // -------------------------------------------------------
  // UPDATE ROLE
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.update))
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      homePath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const { id, ...updates } = input;

      const oldRole = await ctx.prisma.role.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { name: true },
      });

      if (!oldRole) throw new Error("Role not found");

      const updatedRole = await ctx.prisma.role.update({
        where: { id },
        data: updates,
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ROLE,
        entityId: updatedRole.id,
        entityName: oldRole.name,
        metadata: { changes: updates },
        tenantId: ctx.tenantId,
      });

      return updatedRole;
    }),

  // -------------------------------------------------------
  // DELETE ROLE
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const role = await ctx.prisma.role.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { name: true },
      });

      if (!role) throw new Error("Role not found");

      const countUsers = await ctx.prisma.user.count({
        where: { roleId: input.id },
      });

      if (countUsers > 0) {
        throw new Error(`This role cannot be deleted because ${countUsers} user(s) still use it.`);
      }

      const deleted = await ctx.prisma.role.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.ROLE,
        entityId: input.id,
        entityName: role.name,
        metadata: { name: role.name },
        tenantId: ctx.tenantId,
      });

      return deleted;
    }),

  // -------------------------------------------------------
  // ASSIGN PERMISSIONS TO ROLE
  // -------------------------------------------------------
  assignPermissions: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.update))
    .input(z.object({
      roleId: z.string(),
      permissionIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findFirst({
        where: { id: input.roleId, tenantId: ctx.tenantId },
      });

      if (!role) throw new Error("Role not found");

      // Remove existing permissions
      await ctx.prisma.rolePermission.deleteMany({
        where: { roleId: input.roleId },
      });

      // Add new permissions
      if (input.permissionIds.length > 0) {
        await ctx.prisma.rolePermission.createMany({
          data: input.permissionIds.map(permissionId => ({
            roleId: input.roleId,
            permissionId
          }))
        });
      }

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ROLE,
        entityId: input.roleId,
        entityName: role.name,
        metadata: { permissionIds: input.permissionIds },
        tenantId: ctx.tenantId,
      });

      return { success: true };
    }),

  // -------------------------------------------------------
  // GET ROLE PERMISSIONS
  // -------------------------------------------------------
  getPermissions: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.view))
    .input(z.object({ roleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rolePermissions = await ctx.prisma.rolePermission.findMany({
        where: { roleId: input.roleId },
        include: {
          permission: true
        }
      });

      return rolePermissions.map(rp => rp.permission);
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.tenant.roles.view))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.role.count({
        where: { tenantId: ctx.tenantId },
      });

      const withUsers = await ctx.prisma.role.count({
        where: {
          tenantId: ctx.tenantId,
          users: { some: {} },
        },
      });

      return {
        total,
        withUsers,
        withoutUsers: total - withUsers,
      };
    }),
});
