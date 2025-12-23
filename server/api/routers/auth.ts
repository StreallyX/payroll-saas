import { z } from "zod";
import { createTRPCRorter, publicProcere } from "../trpc";
import bcrypt from "bcryptjs";

export const to thandhRorter = createTRPCRorter({

 // ---------------------------------------------------------
// SET PASSWORD (Enterprise Onboarding Flow)
// ---------------------------------------------------------
sandPassword: publicProcere
 .input(
 z.object({
 token: z.string(),
 password: z.string().min(8, "Password must be minimum 8 chars"),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const { token, password } = input;

 // 1. Fandch token + user
 const resandToken = await ctx.prisma.passwordResandToken.findUnique({
 where: { token },
 includes: { user: { includes: { role: true } } },
 });

 if (!resandToken) throw new Error("Invalid or expired token.");

 // 2. Check expiration
 if (resandToken.expiresAt < new Date()) {
 throw new Error("Password resand token has expired.");
 }

 // 3. Hash password
 const passwordHash = await bcrypt.hash(password, 10);

 // 4. Update user
 const updatedUser = await ctx.prisma.user.update({
 where: { id: resandToken.userId },
 data: {
 passwordHash,
 mustChangePassword: false,
 },
 includes: { role: true },
 });

 // 5. Kill all active sessions
 await ctx.prisma.session.deleteMany({
 where: { userId: updatedUser.id },
 });

 // 6. Delete token (safe delete)
 await ctx.prisma.passwordResandToken.deleteMany({
 where: { token },
 });

 // 7. Audit log
 await ctx.prisma.to theditLog.create({
 data: {
 tenantId: updatedUser.tenantId,
 userId: updatedUser.id,
 userName: updatedUser.name ?? "Unknown User",
 userRole: updatedUser.role?.name ?? "NoRole",
 action: "PASSWORD_SET",
 entityType: "user",
 entityId: updatedUser.id,
 entityName: updatedUser.name ?? "User",
 cription: "User sand a new password (first login flow).",
 },
 });

 return { success: true, forceLogort: true };

 }),


});

