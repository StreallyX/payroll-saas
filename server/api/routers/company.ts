import { z } from "zod"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"

import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { emailService } from "@/lib/email/emailService"

function generateRandomPassword(length: number = 16): string {
  return crypto.randomBytes(length).toString("base64").slice(0, length)
}

const P = {
  LIST_GLOBAL: "company.list.global",
  LIST_OWN:    "company.list.own",

  CREATE_GLOBAL: "company.create.global",
  CREATE_OWN:    "company.create.own",

  UPDATE_GLOBAL: "company.update.global",
  UPDATE_OWN:    "company.update.own",

  DELETE_GLOBAL: "company.delete.global",
  DELETE_OWN:    "company.delete.own",

  TRANSFER_GLOBAL: "company.transfer.global",
  TRANSFER_OWN:    "company.transfer.own",
}

export const companyRouter = createTRPCRouter({


  // ============================================================
  // LIST ALL (GLOBAL or OWN)
  // ============================================================
  getAll: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
    .query(async ({ ctx }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const canListGlobal = user.permissions.includes(P.LIST_GLOBAL)

      if (canListGlobal) {
        return ctx.prisma.company.findMany({
          where: { tenantId },
          include: {
            country: true,
            bank: true,
            companyUsers: { include: { user: true } },
            // Include owner info for user-owned companies
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      }

      // OWN — via CompanyUser membership
      const memberships = await ctx.prisma.companyUser.findMany({
        where: { userId: user.id },
        select: { companyId: true },
      })

      const companyIds = memberships.map((m) => m.companyId)

      return ctx.prisma.company.findMany({
        where: {
          id: { in: companyIds },
          tenantId,
        },
        include: {
          country: true,
          bank: true,
          companyUsers: { include: { user: true } },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // ============================================================
  // GET BY ID (GLOBAL or OWN)
  // ============================================================
  getById: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.id, tenantId },
        include: {
          country: true,
          bank: true,
          companyUsers: { include: { user: true } },
        },
      })

      if (!company) return null

      if (user.permissions.includes(P.LIST_GLOBAL)) {
        return company
      }

      // OWN
      const membership = await ctx.prisma.companyUser.findFirst({
        where: { companyId: input.id, userId: user.id },
      })

      if (!membership) throw new TRPCError({ code: "UNAUTHORIZED" })

      return company
    }),


  // ============================================================
  // GET COMPANIES BY OWNER (for contractor company management)
  // ============================================================
  getByOwner: tenantProcedure
    .use(hasAnyPermission([P.LIST_GLOBAL, P.LIST_OWN]))
    .input(z.object({ ownerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId!

      return ctx.prisma.company.findMany({
        where: {
          tenantId,
          ownerId: input.ownerId,
          ownerType: "user",
        },
        include: {
          country: true,
          bank: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),


  // ============================================================
  // CREATE COMPANY (GLOBAL or OWN)
  // ============================================================
  create: tenantProcedure
    .use(hasAnyPermission([P.CREATE_GLOBAL, P.CREATE_OWN]))
    .input(
      z.object({
        name: z.string().min(1),
        bankId: z.string().nullable().optional(),
        ownerType: z.enum(["tenant", "user"]).default("user"),
        ownerId: z.string().optional(), // Allow specifying owner (for admin creating company for contractor)

        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),

        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),

        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().email().optional().or(z.literal("")),
        alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),

        vatNumber: z.string().optional(),
        website: z.string().optional().transform((val) => {
          if (!val || val === "") return undefined;
          if (!/^https?:\/\//i.test(val)) {
            return `https://${val}`;
          }
          return val;
        }),

        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const canCreateGlobal = user.permissions.includes(P.CREATE_GLOBAL)

      // Only users with global permission can create tenant companies or set custom ownerId
      // Admin (with CREATE_GLOBAL) can create companies for others - ownerId should be specified
      // Non-admin (CREATE_OWN only) creates company for themselves
      const finalOwnerType = canCreateGlobal ? input.ownerType : "user"

      let finalOwnerId: string | null = null
      if (finalOwnerType === "tenant") {
        // Tenant-owned companies have no individual owner
        finalOwnerId = null
      } else if (canCreateGlobal) {
        // Admin creating company: use provided ownerId, or null if not specified
        // Admin should NOT become owner of companies they create for others
        finalOwnerId = input.ownerId || null
      } else {
        // User creating their own company
        finalOwnerId = user.id
      }

      const { ownerType: _, ownerId: __, ...restInput } = input

      const company = await ctx.prisma.company.create({
        data: {
          ...restInput,
          tenantId,
          createdBy: user.id,
          ownerType: finalOwnerType,
          ownerId: finalOwnerId,
        },
      })

      // Register owner as CompanyUser (the actual owner, not necessarily the creator)
      if (finalOwnerId) {
        await ctx.prisma.companyUser.create({
          data: {
            userId: finalOwnerId,
            companyId: company.id,
            role: "owner",
          },
        })
      }

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        entityId: company.id,
        entityName: company.name,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COMPANY,
        tenantId,
      })

      return company
    }),



  // ============================================================
  // UPDATE COMPANY (GLOBAL or OWN)
  // ============================================================
  update: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        bankId: z.string().nullable().optional(),

        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),

        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),

        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().email().optional().or(z.literal("")),
        alternateInvoicingEmail: z.string().email().optional().or(z.literal("")),

        vatNumber: z.string().optional(),
        website: z
          .string()
          .optional()
          .transform((val) => {
            if (!val || val.trim() === "") return undefined;

            const withProtocol = /^https?:\/\//i.test(val)
              ? val
              : `https://${val}`;

            return withProtocol;
          })
          .refine(
            (val) => !val || /^https?:\/\/.+\..+/.test(val),
            { message: "Invalid website URL" }
          ),


        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND" })

      const canUpdateGlobal = user.permissions.includes(P.UPDATE_GLOBAL)

      if (!canUpdateGlobal) {
        // OWN → must be CompanyUser member
        const membership = await ctx.prisma.companyUser.findFirst({
          where: { companyId: input.id, userId: user.id },
        })

        if (!membership) {
          throw new TRPCError({ code: "UNAUTHORIZED" })
        }
      }

      const updated = await ctx.prisma.company.update({
        where: { id: input.id },
        data: input,
      })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        entityId: updated.id,
        entityName: updated.name,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COMPANY,
        tenantId,
      })

      return updated
    }),


  // ============================================================
  // DELETE COMPANY (GLOBAL or OWN)
  // ============================================================
  delete: tenantProcedure
    .use(hasAnyPermission([P.DELETE_GLOBAL, P.DELETE_OWN]))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.id, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND" })

      const canDeleteGlobal = user.permissions.includes(P.DELETE_GLOBAL)

      if (!canDeleteGlobal) {
        const membership = await ctx.prisma.companyUser.findFirst({
          where: { companyId: company.id, userId: user.id },
        })

        if (!membership) throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      await ctx.prisma.company.delete({ where: { id: company.id } })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        entityId: company.id,
        entityName: company.name,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.COMPANY,
        tenantId,
      })

      return { success: true }
    }),

  // ============================================================
  // ADD CONTACT/USER TO COMPANY
  // ============================================================
  addContact: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
    .input(
      z.object({
        companyId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.enum(["contact", "billing_contact", "member", "admin"]).default("contact"),
        hasPortalAccess: z.boolean().default(false),
        // Note: Portal role is ALWAYS "agency" for agency company users - no choice
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      // Verify company exists and user has access
      const company = await ctx.prisma.company.findFirst({
        where: { id: input.companyId, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" })

      const canUpdateGlobal = user.permissions.includes(P.UPDATE_GLOBAL)
      if (!canUpdateGlobal) {
        const membership = await ctx.prisma.companyUser.findFirst({
          where: { companyId: input.companyId, userId: user.id },
        })
        if (!membership) throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      // Check if user with this email already exists
      let contactUser = await ctx.prisma.user.findFirst({
        where: { email: input.email, tenantId },
      })

      if (!contactUser) {
        // Find the best role for agency users
        // Priority: AGENCY > agency > Agency > any role with "agency" in name > any non-admin role
        let userRole = await ctx.prisma.role.findFirst({
          where: { tenantId, name: { in: ["AGENCY", "agency", "Agency"] } },
        })

        if (!userRole) {
          // Try to find any role with "agency" in the name (case insensitive)
          userRole = await ctx.prisma.role.findFirst({
            where: {
              tenantId,
              OR: [
                { name: { contains: "agency", mode: "insensitive" } },
                { displayName: { contains: "agency", mode: "insensitive" } },
              ]
            },
          })
        }

        if (!userRole) {
          // Fallback: any role that's not admin/superadmin
          userRole = await ctx.prisma.role.findFirst({
            where: {
              tenantId,
              name: { notIn: ["admin", "Admin", "ADMIN", "superadmin", "Superadmin", "SUPERADMIN", "Super Admin"] }
            },
          })
        }

        if (!userRole) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No suitable role found for agency users. Please create a role first."
          })
        }

        // Generate a random password (user can reset it later if needed)
        const tempPassword = generateRandomPassword(16)
        const passwordHash = await bcrypt.hash(tempPassword, 10)

        contactUser = await ctx.prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            tenantId,
            roleId: userRole.id,
            passwordHash,
            isActive: input.hasPortalAccess, // Only active if they have portal access
            mustChangePassword: true,
          },
        })
      }

      // Check if already linked to company
      const existingLink = await ctx.prisma.companyUser.findFirst({
        where: { companyId: input.companyId, userId: contactUser.id },
      })

      if (existingLink) {
        throw new TRPCError({ code: "CONFLICT", message: "This person is already linked to this company" })
      }

      // Create the company-user link
      await ctx.prisma.companyUser.create({
        data: {
          companyId: input.companyId,
          userId: contactUser.id,
          role: input.role,
        },
      })

      // Send invitation email if user has portal access
      if (input.hasPortalAccess) {
        try {
          // Create password reset token for account setup
          const token = crypto.randomBytes(48).toString("hex")
          await ctx.prisma.passwordResetToken.create({
            data: {
              userId: contactUser.id,
              token,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          })

          const tenant = await ctx.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true },
          })

          const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/set-password?token=${token}`

          await emailService.sendWithTemplate(
            'account-invitation',
            {
              userName: input.name,
              userEmail: input.email,
              companyName: tenant?.name || 'Your Company',
              setupUrl,
              loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`,
            },
            { to: input.email },
            'high'
          )

          await ctx.prisma.emailLog.create({
            data: {
              tenantId,
              to: input.email,
              from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
              subject: 'You have been invited to join the platform',
              template: 'account-invitation',
              status: 'SENT',
              sentAt: new Date(),
            },
          })
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
          // Don't fail the whole operation if email fails
        }
      }

      return { success: true, userId: contactUser.id }
    }),

  // ============================================================
  // REMOVE CONTACT/USER FROM COMPANY
  // ============================================================
  removeContact: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
    .input(
      z.object({
        companyId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      // Verify company exists and user has access
      const company = await ctx.prisma.company.findFirst({
        where: { id: input.companyId, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" })

      const canUpdateGlobal = user.permissions.includes(P.UPDATE_GLOBAL)
      if (!canUpdateGlobal) {
        const membership = await ctx.prisma.companyUser.findFirst({
          where: { companyId: input.companyId, userId: user.id },
        })
        if (!membership) throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      // Delete the company-user link
      await ctx.prisma.companyUser.deleteMany({
        where: {
          companyId: input.companyId,
          userId: input.userId,
        },
      })

      return { success: true }
    }),

  // ============================================================
  // UPDATE CONTACT ROLE
  // ============================================================
  updateContactRole: tenantProcedure
    .use(hasAnyPermission([P.UPDATE_GLOBAL, P.UPDATE_OWN]))
    .input(
      z.object({
        companyId: z.string(),
        userId: z.string(),
        role: z.enum(["contact", "billing_contact", "member", "admin", "owner"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.companyId, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" })

      const canUpdateGlobal = user.permissions.includes(P.UPDATE_GLOBAL)
      if (!canUpdateGlobal) {
        const membership = await ctx.prisma.companyUser.findFirst({
          where: { companyId: input.companyId, userId: user.id },
        })
        if (!membership) throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      await ctx.prisma.companyUser.updateMany({
        where: {
          companyId: input.companyId,
          userId: input.userId,
        },
        data: { role: input.role },
      })

      return { success: true }
    }),

  // ============================================================
  // TRANSFER OWNERSHIP
  // ============================================================
  transferOwnership: tenantProcedure
    .use(hasAnyPermission([P.TRANSFER_GLOBAL, P.TRANSFER_OWN]))
    .input(
      z.object({
        companyId: z.string(),
        newOwnerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId!

      const company = await ctx.prisma.company.findFirst({
        where: { id: input.companyId, tenantId },
      })

      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" })

      // Check permissions: TRANSFER_GLOBAL can transfer any, TRANSFER_OWN only if owner
      const canTransferGlobal = user.permissions.includes(P.TRANSFER_GLOBAL)
      const isOwner = company.ownerId === user.id

      if (!canTransferGlobal && !isOwner) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Only the owner or admin can transfer ownership" })
      }

      // Verify the new owner is a member of the company
      const newOwnerMembership = await ctx.prisma.companyUser.findFirst({
        where: { companyId: input.companyId, userId: input.newOwnerId },
      })

      if (!newOwnerMembership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "New owner must be a member of the company" })
      }

      // Update company owner
      await ctx.prisma.company.update({
        where: { id: input.companyId },
        data: { ownerId: input.newOwnerId },
      })

      // Update roles: new owner becomes "owner", old owner becomes "admin"
      await ctx.prisma.companyUser.updateMany({
        where: { companyId: input.companyId, userId: input.newOwnerId },
        data: { role: "owner" },
      })

      if (company.ownerId) {
        await ctx.prisma.companyUser.updateMany({
          where: { companyId: input.companyId, userId: company.ownerId },
          data: { role: "admin" },
        })
      }

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        entityId: company.id,
        entityName: company.name,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COMPANY,
        tenantId,
        metadata: { action: "ownership_transfer", newOwnerId: input.newOwnerId },
      })

      return { success: true }
    }),
})
