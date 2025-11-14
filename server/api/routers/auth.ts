import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import bcrypt from "bcryptjs";

export const authRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // SET PASSWORD (Enterprise Onboarding Flow)
  // ---------------------------------------------------------
  setPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8, "Password must be minimum 8 chars"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input;

      // 1. Find token in DB
      const resetToken = await ctx.prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        throw new Error("Invalid or expired token.");
      }

      // 2. Check expiration
      if (resetToken.expiresAt < new Date()) {
        throw new Error("Password reset token has expired.");
      }

      // 3. Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // 4. Update user password
      const updatedUser = await ctx.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
        },
      });

      // 5. Delete token (prevent reuse)
      await ctx.prisma.passwordResetToken.delete({
        where: { token },
      });

      // 6. Audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: updatedUser.tenantId,
          userId: updatedUser.id,
          userName: updatedUser.name ?? "",
          userRole: updatedUser.roleId ?? "",
          action: "PASSWORD_SET",
          entityType: "user",
          entityId: updatedUser.id,
          entityName: updatedUser.name,
          description: `User set a new password (first login flow).`,
        },
      });

      return { success: true };
    }),

});

