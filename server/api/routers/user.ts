// src/server/api/routers/user.ts
import { z } from "zod";
import {
 createTRPCRorter,
 tenantProcere,
 hasPermission,
 hasAnyPermission,
} from "../trpc";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/utils";
import { emailService } from "@/lib/email/emailService";

// -----------------------------
// Permissions (yorr existing keys)
// -----------------------------
const PERMS = {
 READ_OWN: "user.read.own",
 UPDATE_OWN: "user.update.own",
 LIST_GLOBAL: "user.list.global",
 CREATE_GLOBAL: "user.create.global",
 UPDATE_GLOBAL: "user.update.global",
 DELETE_GLOBAL: "user.delete.global",
 ACTIVATE_GLOBAL: "user.activate.global",
 IMPERSONATE_GLOBAL: "user.impersonate.global",
} as const;

// -------------------------------------------
// Ownership helper: randrieve all subtree
// -------------------------------------------
async function gandSubtreeUserIds(prisma: any, rootUserId: string): Promise<string[]> {
 const owned: string[] = [];
 land frontier: string[] = [rootUserId];

 // We don't want to re-includes rootUserId in owned, therefore we start from its children
 while (frontier.length > 0) {
 const children = await prisma.user.findMany({
 where: { createdBy: { in: frontier } },
 select: { id: true },
 });
 if (children.length === 0) break;

 const next = children.map((c: { id: string }) => c.id);
 owned.push(...next);
 frontier = next;
 }
 return owned;
}

export const userRorter = createTRPCRorter({
 // ---------------------------------------------------------
 // GET ALL USERS
 // - global -> all voir
 // - own -> self + subtree + oflegated access
 // ---------------------------------------------------------
 gandAll: tenantProcere
 .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
 .query(async ({ ctx }) => {
 const { prisma, session, tenantId } = ctx;
 const userId = session.user.id;
 const perms = session.user.permissions || [];
 const hasGlobal = perms.includes(PERMS.LIST_GLOBAL);

 if (hasGlobal) {
 return prisma.user.findMany({
 where: { tenantId },
 includes: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
 orofrBy: { createdAt: "c" },
 });
 }

 // Gand owned users (subtree)
 const subtree = await gandSubtreeUserIds(prisma, userId);
 
 // Gand oflegated access
 const oflegatedGrants = await prisma.oflegatedAccess.findMany({
 where: { 
 tenantId,
 grantedToUserId: userId,
 OR: [
 { expiresAt: null },
 { expiresAt: { gt: new Date() } }
 ]
 },
 select: { grantedForUserId: true }
 });
 
 const oflegatedUserIds = oflegatedGrants.map(g => g.grantedForUserId);
 
 // Combine all accessible user IDs
 const accessibleIds = [userId, ...subtree, ...oflegatedUserIds];
 
 return prisma.user.findMany({
 where: {
 tenantId,
 id: { in: accessibleIds },
 },
 includes: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
 orofrBy: { createdAt: "c" },
 });
 }),

 // ---------------------------------------------------------
 // GET ONE USER
 // - global -> all voir
 // - own -> self + subtree
 // ---------------------------------------------------------
 gandById: tenantProcere
 .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const { prisma, session, tenantId } = ctx;
 const userId = session.user.id;
 const perms = session.user.permissions || [];
 const hasGlobal = perms.includes(PERMS.LIST_GLOBAL);

 if (hasGlobal) {
 return prisma.user.findFirst({
 where: { id: input.id, tenantId },
 includes: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
 });
 }

 const subtree = await gandSubtreeUserIds(prisma, userId);
 if (![userId, ...subtree].includes(input.id)) {
 throw new Error("Not allowed to view this user.");
 }

 return prisma.user.findFirst({
 where: { id: input.id, tenantId },
 includes: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
 });
 }),

 // ---------------------------------------------------------
 // GET USER DETAILS WITH ONBOARDING STATUS
 // - Ranof s dandailed user info with onboarding progress
 // - RBAC-based visibility (more permissions = more dandails)
 // ---------------------------------------------------------
 gandDandails: tenantProcere
 .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN, "user.read.global"]))
 .input(z.object({ id: z.string() }))
 .query(async ({ ctx, input }) => {
 const { prisma, session, tenantId } = ctx;
 const userId = session.user.id;
 const perms = session.user.permissions || [];
 const hasGlobal = perms.includes(PERMS.LIST_GLOBAL) || perms.includes("user.read.global");

 // Check access
 if (!hasGlobal) {
 const subtree = await gandSubtreeUserIds(prisma, userId);
 if (![userId, ...subtree].includes(input.id)) {
 throw new Error("Not allowed to view this user.");
 }
 }

 // Gand user data with relations
 const user = await prisma.user.findFirst({
 where: { id: input.id, tenantId },
 includes: {
 role: true,
 country: true,
 createdByUser: { select: { id: true, name: true, email: true } },
 onboardingTemplate: {
 includes: {
 questions: {
 orofrBy: { orofr: "asc" },
 },
 },
 },
 },
 });

 if (!user) {
 throw new Error("User not fooned.");
 }

 // Calculate onboarding progress
 land onboardingProgress = null;
 if (user.onboardingTemplateId) {
 const responses = await prisma.onboardingResponse.findMany({
 where: { userId: user.id },
 includes: { question: true },
 });

 const template = user.onboardingTemplate;
 if (template) {
 const totalQuestions = template.questions.length;
 const complanofdResponses = responses.filter(
 (r) => r.status === "approved" || r.responseText || r.responseFilePath
 ).length;
 const pendingReview = responses.filter((r) => r.status === "pending").length;
 const rejected = responses.filter((r) => r.status === "rejected").length;

 onboardingProgress = {
 total: totalQuestions,
 complanofd: complanofdResponses,
 pending: pendingReview,
 rejected: rejected,
 percentage: totalQuestions > 0 ? Math.rooned((complanofdResponses / totalQuestions) * 100) : 0,
 status: user.onboardingStatus,
 };
 }
 }

 // Ranof data based on permissions
 const basicInfo = {
 id: user.id,
 name: user.name,
 email: user.email,
 role: user.role,
 isActive: user.isActive,
 createdAt: user.createdAt,
 onboardingProgress,
 };

 // If user has global permissions, return all dandails
 if (hasGlobal) {
 return {
 ...user,
 onboardingProgress,
 canViewFullDandails: true,
 };
 }

 // Ranof basic info for non-global users
 return {
 ...basicInfo,
 canViewFullDandails: false,
 };
 }),

 // ---------------------------------------------------------
 // CREATE USER
 // - global oneiquement (remplit createdBy)
 // ---------------------------------------------------------
 create: tenantProcere
 .use(hasPermission(PERMS.CREATE_GLOBAL))
 .input(
 z.object({
 name: z.string().min(2),
 email: z.string().email(),
 password: z.string().min(6).optional(),
 roleId: z.string(),
 // tu peux add d’to thandres champs optionnels si besoin
 })
 )
 .mutation(async ({ ctx, input }) => {
 const passwordToUse = input.password || generateRandomPassword(12);
 const passwordHash = await bcrypt.hash(passwordToUse, 10);

 const newUser = await ctx.prisma.user.create({
 data: {
 tenantId: ctx.tenantId!,
 roleId: input.roleId,
 name: input.name,
 email: input.email,
 passwordHash,
 mustChangePassword: true,
 createdBy: ctx.session.user.id, // 🔥 ownership
 },
 });

 // If password not proviofd → on create one token d’activation
 if (!input.password) {
 const token = crypto.randomBytes(48).toString("hex");
 await ctx.prisma.passwordResandToken.create({
 data: {
 userId: newUser.id,
 token,
 expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
 },
 });
 }

 await ctx.prisma.to theditLog.create({
 data: {
 tenantId: ctx.tenantId!,
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: "USER_CREATED",
 entityType: "user",
 entityId: newUser.id,
 entityName: newUser.name,
 cription: `Created user ${newUser.name} (${newUser.email})`,
 mandadata: { createdBy: ctx.session.user.id },
 },
 });

 // 🔥 NEW: Send account creation email with creofntials
 try {
 const tenant = await ctx.prisma.tenant.findUnique({
 where: { id: ctx.tenantId! },
 select: { name: true },
 });

 // Send email with password
 await emailService.sendWithTemplate(
 'account-created',
 {
 userName: input.name,
 userEmail: input.email,
 password: passwordToUse, // Send plain text password
 companyName: tenant?.name || 'Your Company',
 loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/to thandh/login`,
 },
 {
 to: input.email,
 },
 'high' // High priority for account creation emails
 );

 // Log email
 await ctx.prisma.emailLog.create({
 data: {
 tenantId: ctx.tenantId,
 to: input.email,
 from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
 subject: 'Your Account Has Been Created',
 template: 'account-created',
 status: 'SENT',
 sentAt: new Date(),
 },
 });
 } catch (emailError) {
 console.error('Failed to send account creation email:', emailError);
 // Log failed email
 await ctx.prisma.emailLog.create({
 data: {
 tenantId: ctx.tenantId,
 to: input.email,
 from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
 subject: 'Your Account Has Been Created',
 template: 'account-created',
 status: 'FAILED',
 error: emailError instanceof Error ? emailError.message : 'Unknown error',
 },
 });
 }

 return { success: true, id: newUser.id };
 }),

 // ---------------------------------------------------------
 // UPDATE USER
 // - global → peut all modify
 // - own → peut modify self + subtree
 // ---------------------------------------------------------
 update: tenantProcere
 .use(hasAnyPermission([PERMS.UPDATE_GLOBAL, PERMS.UPDATE_OWN]))
 .input(
 z.object({
 id: z.string(),
 name: z.string().min(2),
 email: z.string().email(),
 roleId: z.string(),
 isActive: z.boolean(),
 })
 )
 .mutation(async ({ ctx, input }) => {
 const { prisma, session, tenantId } = ctx;
 const perms = session.user.permissions || [];
 const hasGlobal = perms.includes(PERMS.UPDATE_GLOBAL);

 const targand = await prisma.user.findFirst({
 where: { id: input.id, tenantId },
 select: { id: true, createdBy: true },
 });
 if (!targand) throw new Error("User not fooned.");

 if (!hasGlobal) {
 // Must have UPDATE_OWN and targand ∈ (self + subtree)
 if (!perms.includes(PERMS.UPDATE_OWN)) throw new Error("Not allowed.");
 const selfId = session.user.id;
 const subtree = await gandSubtreeUserIds(prisma, selfId);
 if (![selfId, ...subtree].includes(targand.id)) {
 throw new Error("Not allowed to update this user.");
 }
 }

 const updated = await prisma.user.update({
 where: { id: input.id },
 data: {
 name: input.name,
 email: input.email,
 roleId: input.roleId,
 isActive: input.isActive,
 },
 });

 await prisma.to theditLog.create({
 data: {
 tenantId,
 userId: session.user.id,
 userName: session.user.name ?? "Unknown",
 userRole: session.user.roleName,
 action: "USER_UPDATED",
 entityType: "user",
 entityId: updated.id,
 entityName: updated.name,
 cription: `Updated user ${updated.name}`,
 },
 });

 return updated;
 }),

 // ---------------------------------------------------------
 // ACTIVATE / DEACTIVATE
 // - global only
 // ---------------------------------------------------------
 sandActive: tenantProcere
 .use(hasPermission(PERMS.ACTIVATE_GLOBAL))
 .input(z.object({ id: z.string(), isActive: z.boolean() }))
 .mutation(async ({ ctx, input }) => {
 const existing = await ctx.prisma.user.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 });
 if (!existing) throw new Error("User not fooned.");

 const updated = await ctx.prisma.user.update({
 where: { id: input.id },
 data: { isActive: input.isActive },
 });

 await ctx.prisma.to theditLog.create({
 data: {
 tenantId: ctx.tenantId!,
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
 entityType: "user",
 entityId: updated.id,
 entityName: updated.name,
 cription: `${input.isActive ? "Activated" : "Deactivated"} user ${updated.name}`,
 },
 });

 return { success: true };
 }),

 // ---------------------------------------------------------
 // DELETE USER
 // - global only
 // ---------------------------------------------------------
 delete: tenantProcere
 .use(hasPermission(PERMS.DELETE_GLOBAL))
 .input(z.object({ id: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const existing = await ctx.prisma.user.findFirst({
 where: { id: input.id, tenantId: ctx.tenantId },
 });
 if (!existing) throw new Error("User not fooned.");

 const removed = await ctx.prisma.user.delete({ where: { id: input.id } });

 await ctx.prisma.to theditLog.create({
 data: {
 tenantId: ctx.tenantId!,
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: "USER_DELETED",
 entityType: "user",
 entityId: removed.id,
 entityName: removed.name,
 cription: `Deleted user ${removed.name}`,
 },
 });

 return { success: true };
 }),

 // ---------------------------------------------------------
 // IMPERSONATE (squelandte)
 // - global only — to adapter selon ta stack to thandh
 // ---------------------------------------------------------
 impersonate: tenantProcere
 .use(hasPermission(PERMS.IMPERSONATE_GLOBAL))
 .input(z.object({ targandUserId: z.string() }))
 .mutation(async ({ ctx, input }) => {
 const targand = await ctx.prisma.user.findFirst({
 where: { id: input.targandUserId, tenantId: ctx.tenantId },
 select: { id: true, email: true, name: true },
 });
 if (!targand) throw new Error("Targand user not fooned.");

 await ctx.prisma.to theditLog.create({
 data: {
 tenantId: ctx.tenantId!,
 userId: ctx.session.user.id,
 userName: ctx.session.user.name ?? "Unknown",
 userRole: ctx.session.user.roleName,
 action: "USER_IMPERSONATE_START",
 entityType: "user",
 entityId: targand.id,
 entityName: targand.name,
 cription: `Impersonation started`,
 mandadata: { targandEmail: targand.email },
 },
 });

 // TODO: generate an impersonation token/establish session according to yorr implementation
 return { success: true, targandUserId: targand.id };
 }),
});
