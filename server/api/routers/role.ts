import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasAnyPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions"

const LIST_GLOBAL   = buildPermissionKey(Resource.ROLE, Action.LIST, PermissionScope.GLOBAL)
const READ_OWN      = buildPermissionKey(Resource.ROLE, Action.READ, PermissionScope.OWN)

const CREATE_GLOBAL = buildPermissionKey(Resource.ROLE, Action.CREATE, PermissionScope.GLOBAL)
const CREATE_OWN    = buildPermissionKey(Resource.ROLE, Action.CREATE, PermissionScope.OWN)

const UPDATE_GLOBAL = buildPermissionKey(Resource.ROLE, Action.UPDATE, PermissionScope.GLOBAL)
const UPDATE_OWN    = buildPermissionKey(Resource.ROLE, Action.UPDATE, PermissionScope.OWN)

const DELETE_GLOBAL = buildPermissionKey(Resource.ROLE, Action.DELETE, PermissionScope.GLOBAL)
const DELETE_OWN    = buildPermissionKey(Resource.ROLE, Action.DELETE, PermissionScope.OWN)

export const roleRouter = createTRPCRouter({

  getAll: tenantProcedure
    .use(hasAnyPermission([LIST_GLOBAL, READ_OWN]))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      const permissions = ctx.session.user.permissions ?? []
      const canGlobal = permissions.includes(LIST_GLOBAL)

      const where = canGlobal
        ? { tenantId: ctx.tenantId }
        : {
            tenantId: ctx.tenantId,
            OR: [
              { createdBy: userId },
              { id: ctx.session.user.roleId },
            ],
          }

      return ctx.prisma.role.findMany({
        where,
        include: {
          _count: { select: { users: true } },
          rolePermissions: { include: { permission: true } },
        },
        orderBy: { name: "asc" },
      })
    }),

  getById: tenantProcedure
    .use(hasAnyPermission([LIST_GLOBAL, READ_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const permissions = ctx.session.user.permissions ?? []

      const canGlobal = permissions.includes(LIST_GLOBAL)
      const canOwn = permissions.includes(READ_OWN)

      let where: any = { id: input.id, tenantId: ctx.tenantId }

      if (!canGlobal && canOwn) {
        where = {
          id: input.id,
          tenantId: ctx.tenantId,
          OR: [
            { createdBy: userId },
            { users: { some: { id: userId } } },
          ],
        }
      }

      return ctx.prisma.role.findFirst({
        where,
        include: {
          _count: { select: { users: true } },
          rolePermissions: { include: { permission: true } },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      })
    }),

  create: tenantProcedure
    .use(hasAnyPermission([CREATE_GLOBAL, CREATE_OWN]))
    .input(
      z.object({
        name: z.string().min(1),
        homePath: z.string().default("/dashboard"),
        permissionIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const role = await ctx.prisma.role.create({
        data: {
          name: input.name,
          displayName: input.name,
          homePath: input.homePath,
          tenantId: ctx.tenantId,
          level: 1,
          isActive: true,
          isSystem: false,
          description: null,
          color: null,
          icon: null,
          createdBy: userId,
        },
      })

      if (input.permissionIds?.length) {
        await ctx.prisma.rolePermission.createMany({
          data: input.permissionIds.map(permissionId => ({
            roleId: role.id,
            permissionId,
          })),
        })
      }

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.ROLE,
        entityId: role.id,
        entityName: role.name,
        metadata: { permissionIds: input.permissionIds },
        tenantId: ctx.tenantId,
      })

      return role
    }),

  update: tenantProcedure
    .use(hasAnyPermission([UPDATE_GLOBAL, UPDATE_OWN]))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        homePath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const permissions = ctx.session.user.permissions ?? []

      const canGlobal = permissions.includes(UPDATE_GLOBAL)
      const canOwn = permissions.includes(UPDATE_OWN)

      let where: any = { id: input.id, tenantId: ctx.tenantId }
      if (!canGlobal && canOwn) {
        where.createdBy = userId
      }

      const oldRole = await ctx.prisma.role.findFirst({ where })
      if (!oldRole) throw new Error("Role not found or not allowed.")

      const updatedRole = await ctx.prisma.role.update({
        where: { id: input.id },
        data: input,
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ROLE,
        entityId: updatedRole.id,
        entityName: oldRole.name,
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return updatedRole
    }),

  delete: tenantProcedure
    .use(hasAnyPermission([DELETE_GLOBAL, DELETE_OWN]))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const permissions = ctx.session.user.permissions ?? []

      const canGlobal = permissions.includes(DELETE_GLOBAL)
      const canOwn = permissions.includes(DELETE_OWN)

      let where: any = { id: input.id, tenantId: ctx.tenantId }
      if (!canGlobal && canOwn) {
        where.createdBy = userId
      }

      const role = await ctx.prisma.role.findFirst({ where })
      if (!role) throw new Error("Role not found or not allowed.")

      const countUsers = await ctx.prisma.user.count({
        where: { roleId: input.id },
      })

      if (countUsers > 0) {
        throw new Error(
          `This role cannot be deleted because ${countUsers} user(s) still use it.`
        )
      }

      const deleted = await ctx.prisma.role.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.ROLE,
        entityId: deleted.id,
        entityName: role.name,
        metadata: { name: role.name },
        tenantId: ctx.tenantId,
      })

      return deleted
    }),

  getStats: tenantProcedure
    .use(hasAnyPermission([LIST_GLOBAL, READ_OWN]))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      const permissions = ctx.session.user.permissions ?? []

      const canGlobal = permissions.includes(LIST_GLOBAL)
      const canOwn = permissions.includes(READ_OWN)

      let where: any = { tenantId: ctx.tenantId }

      if (!canGlobal && canOwn) {
        where = {
          tenantId: ctx.tenantId,
          OR: [
            { createdBy: userId },
            { id: ctx.session.user.roleId },
          ],
        }
      }

      const total = await ctx.prisma.role.count({ where })

      const withUsers = await ctx.prisma.role.count({
        where: {
          ...where,
          users: { some: {} },
        },
      })

      return {
        total,
        withUsers,
        withoutUsers: total - withUsers,
      }
    }),

    assignPermissions: tenantProcedure
  .use(hasAnyPermission([UPDATE_GLOBAL, UPDATE_OWN])) // option: ajout RBAC
  .input(
    z.object({
      roleId: z.string(),
      permissionIds: z.array(z.string())
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { roleId, permissionIds } = input

    await ctx.prisma.rolePermission.deleteMany({
      where: { roleId }
    })

    if (permissionIds.length > 0) {
      await ctx.prisma.rolePermission.createMany({
        data: permissionIds.map((pid) => ({
          roleId,
          permissionId: pid,
        })),
      })
    }

    await createAuditLog({
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      userRole: ctx.session.user.roleName,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.ROLE,
      entityId: roleId,
      entityName: "permissions",
      metadata: { permissionIds },
      tenantId: ctx.tenantId,
    })

    return { success: true }
  }),


})
