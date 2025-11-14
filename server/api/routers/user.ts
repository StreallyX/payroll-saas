import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { PERMISSIONS } from "../../rbac/permissions";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/utils";

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
  // CREATE USER (ENTERPRISE DEEL STYLE)
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
        companyId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      // 1. Generate enterprise-grade temp password
      const tempPassword = generateRandomPassword(12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // 2. Create the user
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

      // 3. Create a password reset token (for setup page)
      const token = crypto.randomBytes(48).toString("hex");

      await ctx.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      });

      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?token=${token}`;

      // 4. Audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name ?? "Unknown",
          userRole: ctx.session!.user.role,
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
      // Check tenant matches
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId }
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

      // 1. Check tenant matches
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId }
      });

      if (!existing) {
        throw new Error("User not found in tenant.");
      }

      // 2. Delete
      const removed = await ctx.prisma.user.delete({
        where: { id: input.id },
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

