// src/server/api/routers/users.ts

import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { PERMISSIONS } from "../../rbac/permissions";

export const userRouter = createTRPCRouter({
  
  // ---------------------------------------------------------
  // GET ALL USERS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSIONS.USERS_VIEW))
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          role: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ---------------------------------------------------------
  // GET ONE USER
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSIONS.USERS_VIEW))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          role: true,
        },
      });
    }),

  // ---------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSIONS.USERS_CREATE))
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        roleId: z.string(),
        agencyId: z.string().nullable().optional(),
        payrollPartnerId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newUser = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          roleId: input.roleId,
          tenantId: ctx.tenantId!,
          agencyId: input.agencyId ?? null,
          payrollPartnerId: input.payrollPartnerId ?? null,
        },
      });

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.role,
          action: "USER_CREATED",
          entityType: "user",
          entityId: newUser.id,
          entityName: newUser.name,
          description: `Created user ${newUser.name}`,
        },
      });

      return newUser;
    }),

  // ---------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSIONS.USERS_UPDATE))
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2),
        email: z.string().email(),
        roleId: z.string(),
        isActive: z.boolean(),
        agencyId: z.string().nullable().optional(),
        payrollPartnerId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        data: {
          name: input.name,
          email: input.email,
          roleId: input.roleId,
          isActive: input.isActive,
          agencyId: input.agencyId ?? null,
          payrollPartnerId: input.payrollPartnerId ?? null,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.role,
          action: "USER_UPDATED",
          entityType: "user",
          entityId: updated.id,
          entityName: updated.name,
          description: `Updated user ${updated.name}`,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // DELETE USER
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSIONS.USERS_DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const removed = await ctx.prisma.user.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.role,
          action: "USER_DELETED",
          entityType: "user",
          entityId: removed.id,
          entityName: removed.name,
          description: `Deleted user ${removed.name}`,
        },
      });

      return removed;
    }),
});
