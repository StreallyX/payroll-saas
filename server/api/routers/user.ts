// src/server/api/routers/user.ts
import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/utils";
import { emailService } from "@/lib/email/emailService";

// -----------------------------
// Permissions (your existing keys)
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
// Ownership helper: retrieves entire subtree
// -------------------------------------------
async function getSubtreeUserIds(prisma: any, rootUserId: string): Promise<string[]> {
  const owned: string[] = [];
  let frontier: string[] = [rootUserId];

  // We do NOT want to re-include rootUserId in owned, so we start from its children
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

export const userRouter = createTRPCRouter({
  // ---------------------------------------------------------
  // GET ALL USERS
  // - global -> see everything
  // - own    -> self + subtree + delegated access
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
    .query(async ({ ctx }) => {
      const { prisma, session, tenantId } = ctx;
      const userId = session.user.id;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.LIST_GLOBAL);

      if (hasGlobal) {
        return prisma.user.findMany({
          where: { tenantId },
          include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        });
      }

      // Get owned users (subtree)
      const subtree = await getSubtreeUserIds(prisma, userId);
      
      // Get delegated access
      const delegatedGrants = await prisma.delegatedAccess.findMany({
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
      
      const delegatedUserIds = delegatedGrants.map(g => g.grantedForUserId);
      
      // Combine all accessible user IDs
      const accessibleIds = [userId, ...subtree, ...delegatedUserIds];
      
      return prisma.user.findMany({
        where: {
          tenantId,
          id: { in: accessibleIds },
        },
        include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ---------------------------------------------------------
  // GET ONE USER
  // - global -> see everything
  // - own    -> self + subtree
  // ---------------------------------------------------------
  getById: tenantProcedure
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
          include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
        });
      }

      const subtree = await getSubtreeUserIds(prisma, userId);
      if (![userId, ...subtree].includes(input.id)) {
        throw new Error("Not allowed to view this user.");
      }

      return prisma.user.findFirst({
        where: { id: input.id, tenantId },
        include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
      });
    }),

  // ---------------------------------------------------------
  // GET USER DETAILS WITH ONBOARDING STATUS
  // - Returns detailed user info with onboarding progress
  // - RBAC-based visibility (more permissions = more details)
  // ---------------------------------------------------------
  getDetails: tenantProcedure
    .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN, "user.read.global"]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma, session, tenantId } = ctx;
      const userId = session.user.id;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.LIST_GLOBAL) || perms.includes("user.read.global");

      // Check access
      if (!hasGlobal) {
        const subtree = await getSubtreeUserIds(prisma, userId);
        if (![userId, ...subtree].includes(input.id)) {
          throw new Error("Not allowed to view this user.");
        }
      }

      // Get user data with relations
      const user = await prisma.user.findFirst({
        where: { id: input.id, tenantId },
        include: {
          role: true,
          country: true,
          createdByUser: { select: { id: true, name: true, email: true } },
          banks: true,
          onboardingTemplate: {
            include: {
              questions: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      // Calculate onboarding progress
      let onboardingProgress = null;
      if (user.onboardingTemplateId) {
        const responses = await prisma.onboardingResponse.findMany({
          where: { userId: user.id },
          include: { question: true },
        });

        const template = user.onboardingTemplate;
        if (template) {
          const totalQuestions = template.questions.length;
          const completedResponses = responses.filter(
            (r) => r.status === "approved" || r.responseText || r.responseFilePath
          ).length;
          const pendingReview = responses.filter((r) => r.status === "pending").length;
          const rejected = responses.filter((r) => r.status === "rejected").length;

          onboardingProgress = {
            total: totalQuestions,
            completed: completedResponses,
            pending: pendingReview,
            rejected: rejected,
            percentage: totalQuestions > 0 ? Math.round((completedResponses / totalQuestions) * 100) : 0,
            status: user.onboardingStatus,
          };
        }
      }

      // Always return full user data with permission flag
      // This ensures consistent TypeScript types
      return {
        ...user,
        onboardingProgress,
        canViewFullDetails: hasGlobal,
      };
    }),

  // ---------------------------------------------------------
  // CREATE USER
  // - global uniquement (remplit createdBy)
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMS.CREATE_GLOBAL))
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        password: z.string().min(6).optional(),
        roleId: z.string(),
        isContact: z.boolean().default(false), // Contact only = no portal access
        sendInvitation: z.boolean().default(true), // Send invitation email
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordToUse = input.password || generateRandomPassword(12);
      const passwordHash = await bcrypt.hash(passwordToUse, 10);

      // If creating a contact, they should be inactive (no portal access)
      const isActive = !input.isContact;

      const newUser = await ctx.prisma.user.create({
        data: {
          tenantId: ctx.tenantId!,
          roleId: input.roleId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          isActive,
          mustChangePassword: !input.isContact, // Contacts don't need to change password
          createdBy: ctx.session.user.id, // 🔥 ownership
        },
      });

      // If password not provided → we create an activation token
      if (!input.password) {
        const token = crypto.randomBytes(48).toString("hex");
        await ctx.prisma.passwordResetToken.create({
          data: {
            userId: newUser.id,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
          },
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_CREATED",
          entityType: "user",
          entityId: newUser.id,
          entityName: newUser.name,
          description: `Created user ${newUser.name} (${newUser.email})`,
          metadata: { createdBy: ctx.session.user.id },
        },
      });

      // 🔥 Send account creation email - only if sendInvitation is true and not a contact
      if (input.sendInvitation && !input.isContact) {
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
              loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`,
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
      }

      return { success: true, id: newUser.id, isContact: input.isContact };
    }),

  // ---------------------------------------------------------
  // UPDATE USER
  // - global → can modify everything
  // - own → can modify self + subtree
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasAnyPermission([PERMS.UPDATE_GLOBAL, PERMS.UPDATE_OWN]))
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2),
        email: z.string().email(),
        roleId: z.string(),
        isActive: z.boolean(),
        // Extended profile fields
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        countryId: z.string().optional(),
        city: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        postCode: z.string().optional(),
        companyName: z.string().optional(),
        vatNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session, tenantId } = ctx;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.UPDATE_GLOBAL);

      const target = await prisma.user.findFirst({
        where: { id: input.id, tenantId },
        select: { id: true, createdBy: true },
      });
      if (!target) throw new Error("User not found.");

      if (!hasGlobal) {
        // Must have UPDATE_OWN and target ∈ (self + subtree)
        if (!perms.includes(PERMS.UPDATE_OWN)) throw new Error("Not allowed.");
        const selfId = session.user.id;
        const subtree = await getSubtreeUserIds(prisma, selfId);
        if (![selfId, ...subtree].includes(target.id)) {
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
          phone: input.phone,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          countryId: input.countryId || undefined,
          city: input.city,
          address1: input.address1,
          address2: input.address2,
          postCode: input.postCode,
          companyName: input.companyName,
          vatNumber: input.vatNumber,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          userName: session.user.name ?? "Unknown",
          userRole: session.user.roleName,
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
  // ACTIVATE / DEACTIVATE
  // - global only
  // ---------------------------------------------------------
  setActive: tenantProcedure
    .use(hasPermission(PERMS.ACTIVATE_GLOBAL))
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new Error("User not found.");

      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entityType: "user",
          entityId: updated.id,
          entityName: updated.name,
          description: `${input.isActive ? "Activated" : "Deactivated"} user ${updated.name}`,
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // DELETE USER
  // - global only
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMS.DELETE_GLOBAL))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new Error("User not found.");

      const removed = await ctx.prisma.user.delete({ where: { id: input.id } });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_DELETED",
          entityType: "user",
          entityId: removed.id,
          entityName: removed.name,
          description: `Deleted user ${removed.name}`,
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // RESEND INVITATION
  // - Creates new password reset token and sends invitation email
  // ---------------------------------------------------------
  resendInvitation: tenantProcedure
    .use(hasPermission(PERMS.UPDATE_GLOBAL))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!

      const targetUser = await ctx.prisma.user.findFirst({
        where: { id: input.userId, tenantId },
      })

      if (!targetUser) throw new Error("User not found.")

      // Delete any existing tokens
      await ctx.prisma.passwordResetToken.deleteMany({
        where: { userId: targetUser.id },
      })

      // Create new token
      const token = crypto.randomBytes(48).toString("hex")
      await ctx.prisma.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      })

      const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/set-password?token=${token}`
      const emailSubject = `You have been invited to join ${tenant?.name || 'Your Company'}`

      try {
        await emailService.sendWithTemplate(
          'account-invitation',
          {
            userName: targetUser.name || 'User',
            userEmail: targetUser.email,
            companyName: tenant?.name || 'Your Company',
            setupUrl,
            loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`,
          },
          { to: targetUser.email },
          'high'
        )

        await ctx.prisma.emailLog.create({
          data: {
            tenantId,
            to: targetUser.email,
            from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
            subject: emailSubject,
            template: 'account-invitation',
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      } catch (emailError) {
        // Log failed email
        await ctx.prisma.emailLog.create({
          data: {
            tenantId,
            to: targetUser.email,
            from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
            subject: emailSubject,
            template: 'account-invitation',
            status: 'FAILED',
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
          },
        })

        console.error('Failed to send invitation email:', emailError)
        throw new Error('Failed to send invitation email. Please check email logs for details.')
      }

      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "INVITATION_RESENT",
          entityType: "user",
          entityId: targetUser.id,
          entityName: targetUser.name,
          description: `Resent invitation to ${targetUser.name} (${targetUser.email})`,
        },
      })

      return { success: true }
    }),

  // ---------------------------------------------------------
  // IMPERSONATE (squelette)
  // - global only — to adapt according to your auth stack
  // ---------------------------------------------------------
  impersonate: tenantProcedure
    .use(hasPermission(PERMS.IMPERSONATE_GLOBAL))
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.prisma.user.findFirst({
        where: { id: input.targetUserId, tenantId: ctx.tenantId },
        select: { id: true, email: true, name: true },
      });
      if (!target) throw new Error("Target user not found.");

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_IMPERSONATE_START",
          entityType: "user",
          entityId: target.id,
          entityName: target.name,
          description: `Impersonation started`,
          metadata: { targetEmail: target.email },
        },
      });

      // TODO: generate impersonation token/establish session according to your provider
      return { success: true, targetUserId: target.id };
    }),

  // ---------------------------------------------------------
  // GET USERS BY ROLE TYPE
  // Filter users by role name pattern (AGENCY, CONTRACTOR, PAYROLL)
  // ---------------------------------------------------------
  getByRoleType: tenantProcedure
    .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
    .input(z.object({
      roleType: z.enum(["AGENCY", "CONTRACTOR", "PAYROLL"]),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, session, tenantId } = ctx;
      const userId = session.user.id;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.LIST_GLOBAL);

      // Map role type to role name patterns
      const rolePatterns: Record<string, string[]> = {
        AGENCY: ["AGENCY", "AGENCY_OWNER", "AGENCY_ADMIN", "AGENCY_MANAGER"],
        CONTRACTOR: ["CONTRACTOR", "WORKER"],
        PAYROLL: ["PAYROLL", "PAYROLL_PARTNER", "PAYROLL_ADMIN"],
      };

      const patterns = rolePatterns[input.roleType] || [input.roleType];

      if (hasGlobal) {
        return prisma.user.findMany({
          where: {
            tenantId,
            role: {
              name: { in: patterns }
            }
          },
          include: {
            role: true,
            country: true,
            createdByUser: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: "desc" },
        });
      }

      // For OWN permission, filter by ownership
      const subtree = await getSubtreeUserIds(prisma, userId);
      const delegatedGrants = await prisma.delegatedAccess.findMany({
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

      const delegatedUserIds = delegatedGrants.map(g => g.grantedForUserId);
      const accessibleIds = [userId, ...subtree, ...delegatedUserIds];

      return prisma.user.findMany({
        where: {
          tenantId,
          id: { in: accessibleIds },
          role: {
            name: { in: patterns }
          }
        },
        include: {
          role: true,
          country: true,
          createdByUser: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
