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

    // 1. Fetch token + user
    const resetToken = await ctx.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { include: { role: true } } },
    });

    if (!resetToken) throw new Error("Invalid or expired token.");

    // 2. Check expiration
    if (resetToken.expiresAt < new Date()) {
      throw new Error("Password reset token has expired.");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Update user
    const updatedUser = await ctx.prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      include: { role: true },
    });

    // 5. Kill all active sessions
    await ctx.prisma.session.deleteMany({
      where: { userId: updatedUser.id },
    });

    // 6. Delete token (safe delete)
    await ctx.prisma.passwordResetToken.deleteMany({
      where: { token },
    });

    // 7. Audit log
    await ctx.prisma.auditLog.create({
      data: {
        tenantId: updatedUser.tenantId,
        userId: updatedUser.id,
        userName: updatedUser.name ?? "Unknown User",
        userRole: updatedUser.role?.name ?? "NoRole",
        action: "PASSWORD_SET",
        entityType: "user",
        entityId: updatedUser.id,
        entityName: updatedUser.name ?? "User",
        description: "User set a new password (first login flow).",
      },
    });

    return { success: true, forceLogout: true };

  }),


});

