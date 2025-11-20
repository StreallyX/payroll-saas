import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/utils";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";

// -------------------------------------------------------
// PERMISSIONS V3
// -------------------------------------------------------
const VIEW   = buildPermissionKey(Resource.USER, Action.LIST, PermissionScope.GLOBAL);
const CREATE = buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL);
const UPDATE = buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL);
const DELETE = buildPermissionKey(Resource.USER, Action.DELETE, PermissionScope.GLOBAL);

export const userRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL USERS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW))
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany({
        where: { tenantId: ctx.tenantId },
        include: { role: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ---------------------------------------------------------
  // GET ONE USER
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: { role: true },
      });
    }),

  // ---------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(CREATE))
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6).optional(),
        roleId: z.string(),
        agencyId: z.string().nullable().optional(),
        payrollPartnerId: z.string().nullable().optional(),
        companyId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordToUse = input.password || generateRandomPassword(12);
      const passwordHash = await bcrypt.hash(passwordToUse, 10);

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          roleId: input.roleId,
          tenantId: ctx.tenantId!,
          passwordHash,
          mustChangePassword: true,
          agencyId: input.agencyId ?? null,
          payrollPartnerId: input.payrollPartnerId ?? null,
          companyId: input.companyId ?? null,
        },
      });

      // If password was not provided → send setup token
      if (!input.password) {
        const token = crypto.randomBytes(48).toString("hex");

        await ctx.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });

        const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?token=${token}`;

        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId!,
            userId: ctx.session!.user.id,
            userName: ctx.session!.user.name ?? "Unknown",
            userRole: ctx.session!.user.roleName,
            action: "USER_CREATED",
            entityType: "user",
            entityId: user.id,
            entityName: user.name,
            description: `Created user ${user.name}.`,
            metadata: { setupUrl },
          },
        });

        return {
          success: true,
          message: "User created. Password setup email sent.",
        };
      }

      // If password provided
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.roleName,
          action: "USER_CREATED",
          entityType: "user",
          entityId: user.id,
          entityName: user.name,
          description: `Created user ${user.name} with provided password.`,
        },
      });

      return {
        success: true,
        message: "User created successfully with the provided password.",
      };
    }),

  // ---------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE))
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
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!existing) {
        throw new Error("User not found in tenant.");
      }

      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
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
          userRole: ctx.session!.user.roleName,
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
    .use(hasPermission(DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!existing) throw new Error("User not found in tenant.");

      const removed = await ctx.prisma.user.delete({
        where: { id: input.id },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.roleName,
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
