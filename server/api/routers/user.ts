
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import bcrypt from "bcryptjs"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const userRouter = createTRPCRouter({
  // Get all users for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          role: true,
          contractor: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get user by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          role: true,
          contractor: true,
          tenant: true,
        },
      })
    }),

  // Create user
  create: tenantProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      roleId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists in this tenant
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          tenantId: ctx.tenantId,
        },
      })

      if (existingUser) {
        throw new Error("User with this email already exists")
      }

      // Hash password
      const passwordHash = bcrypt.hashSync(input.password, 10)

      const newUser = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          roleId: input.roleId,
          tenantId: ctx.tenantId,
        },
        include: {
          role: true,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: newUser.id,
        entityName: newUser.name || newUser.email,
        metadata: {
          email: newUser.email,
          roleName: newUser.role.name,
        },
        tenantId: ctx.tenantId,
      })

      return newUser
    }),

  // Update user
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      roleId: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Get current user data for audit log
      const currentUser = await ctx.prisma.user.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { name: true, email: true },
      })

      const updatedUser = await ctx.prisma.user.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
        include: {
          role: true,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER,
        entityId: updatedUser.id,
        entityName: currentUser?.name || currentUser?.email || "User",
        metadata: {
          changes: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return updatedUser
    }),

  // Delete user
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user data before deletion for audit log
      const userToDelete = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: { name: true, email: true },
      })

      const deletedUser = await ctx.prisma.user.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.USER,
        entityId: input.id,
        entityName: userToDelete?.name || userToDelete?.email || "User",
        metadata: {
          email: userToDelete?.email,
        },
        tenantId: ctx.tenantId,
      })

      return deletedUser
    }),

  // Get roles for dropdown
  getRoles: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.role.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { name: "asc" },
      })
    }),
})
