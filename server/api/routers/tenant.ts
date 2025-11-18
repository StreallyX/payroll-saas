import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  protectedProcedure,
  hasPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import {
  ALL_PERMISSIONS,
  buildPermissionKey,
  Resource,
  Action,
  PermissionScope,
  getAllPermissionKeys,
} from "../../rbac/permissions-v2"

export const tenantRouter = createTRPCRouter({

  // -------------------------------------------------------
  // 🟢 GET CURRENT TENANT
  // -------------------------------------------------------
  // NOTE: No permission check required - all authenticated users in a tenant
  // should be able to view their tenant's branding information (logo, colors, etc.)
  // as it's needed for the UI. The tenantProcedure already ensures authentication
  // and tenant membership.
  getCurrent: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          backgroundColor: true,
          sidebarBgColor: true,
          sidebarTextColor: true,
          headerBgColor: true,
          headerTextColor: true,
          customFont: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    }),

  // -------------------------------------------------------
  // 🟦 UPDATE TENANT SETTINGS
  // -------------------------------------------------------
  updateSettings: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        name: z.string().min(1).optional(),
        logoUrl: z.string().url().optional().nullable(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        sidebarBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        sidebarTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        headerBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        headerTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        customFont: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { name: true },
      })

      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: before?.name || "Tenant",
        metadata: { changes: input },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🟧 RESET COLORS
  // -------------------------------------------------------
  resetColors: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .mutation(async ({ ctx }) => {

      const before = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { name: true },
      })

      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          primaryColor: "#3b82f6",
          accentColor: "#10b981",
          backgroundColor: "#ffffff",
          sidebarBgColor: "#ffffff",
          sidebarTextColor: "#111827",
          headerBgColor: "#ffffff",
          headerTextColor: "#111827",
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: before?.name || "Tenant",
        metadata: { action: "reset_colors" },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🔐 SUPERADMIN ONLY (RBAC)
  // -------------------------------------------------------

  // 📊 LIST TENANTS
  getAllForSuperAdmin: protectedProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.MANAGE, PermissionScope.GLOBAL)))
    .query(async ({ ctx }) => {

      const tenants = await ctx.prisma.tenant.findMany({
        include: {
          _count: {
            select: { users: true, contracts: true, invoices: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return tenants.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        userCount: t._count.users,
        contractCount: t._count.contracts,
        invoiceCount: t._count.invoices,
        isActive: t.isActive,
      }))
    }),

  // 🏗️ CREATE TENANT + ADMIN
  createTenantWithAdmin: protectedProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.MANAGE, PermissionScope.GLOBAL)))
    .input(
      z.object({
        tenantName: z.string().min(2),
        primaryColor: z.string().default("#3b82f6"),
        accentColor: z.string().default("#10b981"),
        adminName: z.string().min(2),
        adminEmail: z.string().email(),
        adminPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {

      const exists = await ctx.prisma.user.findFirst({
        where: { email: input.adminEmail },
      })

      if (exists)
        throw new TRPCError({ code: "CONFLICT", message: "Email already used." })

      const result = await ctx.prisma.$transaction(async (prisma) => {
        const tenant = await prisma.tenant.create({
          data: {
            name: input.tenantName,
            primaryColor: input.primaryColor,
            accentColor: input.accentColor,
            isActive: true,
          },
        })

        const rolesNames = ["admin", "agency", "contractor", "payroll_partner"]
        
        const roles = await Promise.all(
          rolesNames.map((name) =>
            prisma.role.create({
              data: {
                tenantId: tenant.id,
                name,
                displayName: name.replace("_", " ").replace("-", " "),
              },
            })
          )
        )


        const adminRole = roles.find((r) => r.name === "admin")!
        // 1. Load all permissions from DB
        const allPermissions = await prisma.permission.findMany({
          where: {
            key: { in: getAllPermissionKeys() }
          }
        });

        // 2. Create rolePermissions using permissionId
        await prisma.rolePermission.createMany({
          data: allPermissions.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
          })),
        });

        const passwordHash = await bcrypt.hash(input.adminPassword, 10)

        const user = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            roleId: adminRole.id,
            name: input.adminName,
            email: input.adminEmail,
            passwordHash,
            isActive: true,
          },
        })

        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name!,
          userRole: "superadmin",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.TENANT,
          entityId: tenant.id,
          entityName: tenant.name,
          description: `Tenant créé avec admin ${input.adminEmail}`,
          tenantId: tenant.id,
        })

        return { tenant, user }
      })

      return result
    }),

  // ⚙️ UPDATE TENANT STATUS
  updateTenantStatus: protectedProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.MANAGE, PermissionScope.GLOBAL)))
    .input(z.object({ tenantId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {

      const tenant = await ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { isActive: input.isActive },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: "superadmin",
        action: input.isActive ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
        entityType: AuditEntityType.TENANT,
        entityId: tenant.id,
        entityName: tenant.name,
        tenantId: tenant.id,
      })

      return tenant
    }),

  // 🗑️ SOFT DELETE TENANT
  deleteTenant: protectedProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.MANAGE, PermissionScope.GLOBAL)))
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const tenant = await ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { isActive: false },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: "superadmin",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.TENANT,
        entityId: tenant.id,
        entityName: tenant.name,
        tenantId: tenant.id,
      })

      return tenant
    }),

  // ===============================================================
  // PHASE 3: MULTI-TENANCY & WHITE-LABEL PROCEDURES
  // ===============================================================

  // -------------------------------------------------------
  // 📊 SUBSCRIPTION MANAGEMENT
  // -------------------------------------------------------
  getSubscriptionInfo: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          currentStorageUsed: true,
          usageMetrics: true,
          quotas: true,
        },
      })

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" })
      }

      return tenant
    }),

  updateSubscriptionPlan: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        plan: z.enum(["free", "starter", "professional", "enterprise"]),
        billingCycle: z.enum(["monthly", "yearly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          subscriptionPlan: input.plan,
          subscriptionStatus: "active",
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Subscription",
        description: `Updated subscription plan to ${input.plan}`,
        metadata: { plan: input.plan, billingCycle: input.billingCycle },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 📈 USAGE & QUOTAS
  // -------------------------------------------------------
  getUsageMetrics: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        include: {
          quotas: true,
          _count: {
            select: {
              users: true,
              contracts: true,
              invoices: true,
              documents: true,
            },
          },
        },
      })

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" })
      }

      return {
        currentUsage: {
          users: tenant._count.users,
          contracts: tenant._count.contracts,
          invoices: tenant._count.invoices,
          storage: tenant.currentStorageUsed,
          documents: tenant._count.documents,
        },
        quotas: tenant.quotas,
        metrics: tenant.usageMetrics as any,
      }
    }),

  updateQuotas: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        maxUsers: z.number().optional(),
        maxContracts: z.number().optional(),
        maxInvoices: z.number().optional(),
        maxStorage: z.bigint().optional(),
        maxAPICallsPerMonth: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quota = await ctx.prisma.tenantQuota.upsert({
        where: { tenantId: ctx.tenantId },
        create: {
          tenantId: ctx.tenantId,
          ...input,
        },
        update: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Quotas",
        description: "Updated tenant quotas",
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return quota
    }),

  checkQuotaAvailability: tenantProcedure
    .input(
      z.object({
        resourceType: z.enum(["users", "contracts", "invoices", "storage", "api_calls"]),
        amount: z.number().optional().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        include: {
          quotas: true,
          _count: {
            select: {
              users: true,
              contracts: true,
              invoices: true,
            },
          },
        },
      })

      if (!tenant || !tenant.quotas) {
        return { available: true, remaining: Infinity }
      }

      let current = 0
      let max = 0

      switch (input.resourceType) {
        case "users":
          current = tenant._count.users
          max = tenant.quotas.maxUsers
          break
        case "contracts":
          current = tenant._count.contracts
          max = tenant.quotas.maxContractsPerMonth
          break
        case "invoices":
          current = tenant._count.invoices
          max = tenant.quotas.maxInvoicesPerMonth
          break
        case "storage":
          current = Number(tenant.currentStorageUsed)
          max = Number(tenant.quotas.maxStorageGB)
          break
      }

      const remaining = max - current
      const available = remaining >= input.amount

      return { available, remaining, current, max }
    }),

  // -------------------------------------------------------
  // 🎯 FEATURE FLAGS
  // -------------------------------------------------------
  getEnabledFeatures: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const features = await ctx.prisma.tenantFeatureFlag.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { featureKey: "asc" },
      })

      return features
    }),

  checkFeatureAccess: tenantProcedure
  .input(z.object({ featureKey: z.string() }))
  .query(async ({ ctx, input }) => {
    const feature = await ctx.prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId: ctx.tenantId,
          featureKey: input.featureKey,
        },
      },
    })

    if (!feature) {
      return { enabled: false, reason: "not_configured" }
    }

    const metadata = feature.metadata as Record<string, any> | null

    if (metadata?.expiresAt && new Date(metadata.expiresAt) < new Date()) {
      return { enabled: false, reason: "expired" }
    }

    return {
      enabled: feature.isEnabled,
      expiresAt: metadata?.expiresAt || null,
    }
  }),


  toggleFeature: tenantProcedure
  .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
  .input(
    z.object({
      featureKey: z.string(),
      enabled: z.boolean(),
      expiresAt: z.date().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const feature = await ctx.prisma.tenantFeatureFlag.upsert({
      where: {
        tenantId_featureKey: {
          tenantId: ctx.tenantId,
          featureKey: input.featureKey,
        },
      },
      create: {
        tenantId: ctx.tenantId,
        featureKey: input.featureKey,
        isEnabled: input.enabled,             // ✔ correct
        metadata: {
          expiresAt: input.expiresAt || null, // ✔ stocké dans metadata
        },
      },
      update: {
        isEnabled: input.enabled,             // ✔ correct
        metadata: {
          expiresAt: input.expiresAt || null, // ✔ correct
        },
      },
    })

    await createAuditLog({
      userId: ctx.session!.user.id,
      userName: ctx.session!.user.name!,
      userRole: ctx.session!.user.roleName,
      action: input.enabled ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      entityType: AuditEntityType.TENANT,
      entityId: ctx.tenantId,
      entityName: "Feature Flag",
      description: `${input.enabled ? "Enabled" : "Disabled"} feature: ${input.featureKey}`,
      metadata: { featureKey: input.featureKey, expiresAt: input.expiresAt },
      tenantId: ctx.tenantId,
    })

    return feature
  }),


  // -------------------------------------------------------
  // 🌍 LOCALIZATION
  // -------------------------------------------------------
  getLocalizationSettings: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          timezone: true,
          defaultLanguage: true,
          defaultCurrency: true,
          dateFormat: true,
          timeFormat: true,
        },
      })

      return tenant
    }),

  updateLocalizationSettings: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        timezone: z.string().optional(),
        defaultLanguage: z.enum(["en", "fr", "es", "de"]).optional(),
        defaultCurrency: z.string().optional(),
        dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
        timeFormat: z.enum(["12h", "24h"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Localization Settings",
        description: "Updated localization settings",
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🌐 DOMAIN MANAGEMENT
  // -------------------------------------------------------
  checkSubdomainAvailability: tenantProcedure
    .input(z.object({ subdomain: z.string().min(3).max(63) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.tenant.findUnique({
        where: { subdomain: input.subdomain.toLowerCase() },
      })

      return { available: !existing }
    }),

  updateSubdomain: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(z.object({ subdomain: z.string().min(3).max(63) }))
    .mutation(async ({ ctx, input }) => {
      const subdomain = input.subdomain.toLowerCase()

      // Check availability
      const existing = await ctx.prisma.tenant.findFirst({
        where: {
          subdomain,
          NOT: { id: ctx.tenantId },
        },
      })

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Subdomain already taken" })
      }

      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: { subdomain },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Subdomain",
        description: `Updated subdomain to ${subdomain}`,
        metadata: { subdomain },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  addCustomDomain: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(z.object({ domain: z.string().min(4) }))
    .mutation(async ({ ctx, input }) => {
      const domain = input.domain.toLowerCase()

      // Check if domain is already used
      const existing = await ctx.prisma.tenant.findFirst({
        where: {
          customDomain: domain,
          NOT: { id: ctx.tenantId },
        },
      })

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Domain already in use" })
      }

      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          customDomain: domain,
          customDomainVerified: false,
          sslCertificateStatus: "pending",
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Custom Domain",
        description: `Added custom domain: ${domain}`,
        metadata: { domain },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  verifyCustomDomain: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .mutation(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { customDomain: true },
      })

      if (!tenant?.customDomain) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No custom domain configured" })
      }

      // TODO: Implement actual DNS verification logic
      // This is a placeholder that marks it as verified
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          customDomainVerified: true,
          sslCertificateStatus: "active",
          sslCertificateExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Custom Domain",
        description: "Verified custom domain",
        metadata: { domain: tenant.customDomain },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  removeCustomDomain: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .mutation(async ({ ctx }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          customDomain: null,
          customDomainVerified: false,
          sslCertificateStatus: null,
          sslCertificateExpiry: null,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Custom Domain",
        description: "Removed custom domain",
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 📧 EMAIL TEMPLATES
  // -------------------------------------------------------
  listEmailTemplates: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.emailTemplate.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })

      return templates
    }),

  createEmailTemplate: tenantProcedure
  .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.CREATE, PermissionScope.TENANT)))
  .input(
    z.object({
      key: z.string(),                         // ex: "welcome_email"
      name: z.string(),                        // human readable name
      subject: z.string(),
      body: z.string(),                        // HTML content
      variables: z.any().optional(),
      isActive: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const template = await ctx.prisma.emailTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        key: input.key,
        name: input.name,
        subject: input.subject,
        body: input.body,
        variables: input.variables || undefined,
        isActive: input.isActive ?? true,
        createdBy: ctx.session!.user.id,
      },
    })

    await createAuditLog({
      userId: ctx.session!.user.id,
      userName: ctx.session!.user.name!,
      userRole: ctx.session!.user.roleName,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TENANT,
      entityId: template.id,
      entityName: "Email Template",
      description: `Created email template: ${input.name}`,
      tenantId: ctx.tenantId,
    })

    return template
  }),


  updateEmailTemplate: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        subject: z.string().optional(),
        htmlBody: z.string().optional(),
        textBody: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const template = await ctx.prisma.emailTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: template.id,
        entityName: "Email Template",
        description: `Updated email template: ${template.name}`,
        tenantId: ctx.tenantId,
      })

      return template
    }),

  deleteEmailTemplate: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.DELETE, PermissionScope.TENANT)))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.TENANT,
        entityId: template.id,
        entityName: "Email Template",
        description: `Deleted email template: ${template.name}`,
        tenantId: ctx.tenantId,
      })

      return template
    }),

  // -------------------------------------------------------
  // 📄 PDF TEMPLATES
  // -------------------------------------------------------
  listPDFTemplates: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const templates = await ctx.prisma.pDFTemplate.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })

      return templates
    }),

  createPDFTemplate: tenantProcedure
  .use(
    hasPermission(
      buildPermissionKey(Resource.TENANT, Action.CREATE, PermissionScope.TENANT)
    )
  )
  .input(
    z.object({
      key: z.string(),            // ex: "invoice_template"
      name: z.string(),           // ex: "Invoice Template v1"
      content: z.string(),        // HTML/template content
      variables: z.any().optional(),
      isActive: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const template = await ctx.prisma.pDFTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        key: input.key,
        name: input.name,
        content: input.content,
        variables: input.variables || undefined,
        isActive: input.isActive ?? true,
        createdBy: ctx.session!.user.id,
      },
    })

    await createAuditLog({
      userId: ctx.session!.user.id,
      userName: ctx.session!.user.name!,
      userRole: ctx.session!.user.roleName,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TENANT,
      entityId: template.id,
      entityName: "PDF Template",
      description: `Created PDF template: ${input.name}`,
      tenantId: ctx.tenantId,
    })

    return template
  }),


  // -------------------------------------------------------
  // 🔒 SECURITY SETTINGS
  // -------------------------------------------------------
  getSecuritySettings: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const settings = await ctx.prisma.tenantSecuritySettings.findUnique({
        where: { tenantId: ctx.tenantId },
      })

      return settings
    }),

  updateSecuritySettings: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        minPasswordLength: z.number().optional(),
        requireUppercase: z.boolean().optional(),
        requireLowercase: z.boolean().optional(),
        requireNumbers: z.boolean().optional(),
        requireSpecialChars: z.boolean().optional(),
        sessionTimeoutMinutes: z.number().optional(),
        maxConcurrentSessions: z.number().optional(),
        enforce2FA: z.boolean().optional(),
        enforce2FAForAdmins: z.boolean().optional(),
        maxLoginAttempts: z.number().optional(),
        lockoutDurationMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.tenantSecuritySettings.upsert({
        where: { tenantId: ctx.tenantId },
        create: {
          tenantId: ctx.tenantId,
          ...input,
        },
        update: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Security Settings",
        description: "Updated security settings",
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return settings
    }),

  // -------------------------------------------------------
  // 📤 DATA EXPORT
  // -------------------------------------------------------
  requestDataExport: tenantProcedure
  .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.EXPORT, PermissionScope.TENANT)))
  .input(
    z.object({
      exportType: z.enum([
        "full_export",
        "users_only",
        "contracts_only",
        "invoices_only",
        "financial_data"
      ]),
      format: z.enum(["json", "csv", "xlsx", "pdf"]),  // <-- MATCH EXACT Prisma
    })
  )
  .mutation(async ({ ctx, input }) => {
    const exportRequest = await ctx.prisma.dataExport.create({
      data: {
        tenantId: ctx.tenantId,
        exportType: input.exportType,      // match Prisma
        status: "pending",                 // match Prisma
        format: input.format,              // match Prisma
        fileUrl: null,
        fileSize: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        requestedBy: ctx.session!.user.id, // match Prisma
      },
    });

    await createAuditLog({
      userId: ctx.session!.user.id,
      userName: ctx.session!.user.name!,
      userRole: ctx.session!.user.roleName,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TENANT,
      entityId: exportRequest.id,
      entityName: "Data Export",
      description: `Requested ${input.exportType} export`,
      metadata: input,
      tenantId: ctx.tenantId,
    });

    return exportRequest;
  }),


  getDataExports: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.EXPORT, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const exports = await ctx.prisma.dataExport.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      return exports
    }),

  downloadDataExport: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.EXPORT, PermissionScope.TENANT)))
    .input(z.object({ exportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const exportData = await ctx.prisma.dataExport.findFirst({
        where: {
          id: input.exportId,
          tenantId: ctx.tenantId,
        },
      })

      if (!exportData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Export not found" })
      }

      if (exportData.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Export is not ready yet" })
      }

      // Update download count
      await ctx.prisma.dataExport.update({
        where: { id: input.exportId },
        data: {
 
        },
      })

      return exportData
    }),

  // -------------------------------------------------------
  // 🎓 ONBOARDING
  // -------------------------------------------------------
  getOnboardingStatus: tenantProcedure
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          onboardingCompleted: true,
          onboardingStep: true,
          onboardingData: true,
        },
      })

      return tenant
    }),

  updateOnboardingProgress: tenantProcedure
    .input(
      z.object({
        step: z.number(),
        completed: z.boolean().optional(),
        data: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          onboardingStep: input.step,
          onboardingCompleted: input.completed ?? false,
          onboardingData: input.data,
        },
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🔐 SUPER ADMIN: IMPERSONATION
  // -------------------------------------------------------
  /*
  impersonateTenant: protectedProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.MANAGE, PermissionScope.GLOBAL)))
    .input(
      z.object({
        tenantId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create impersonation log
      const impersonation = await ctx.prisma.tenantImpersonation.create({
        data: {
          tenantId: input.tenantId,
          superAdminId: ctx.session!.user.id,
          superAdminName: ctx.session!.user.name!,
          superAdminEmail: ctx.session!.user.email!,
          reason: input.reason,
          ipAddress: ctx.session?.ipAddress || null,
          userAgent: ctx.session?.userAgent || null,
          isActive: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: "superadmin",
        action: AuditAction.LOGIN,
        entityType: AuditEntityType.TENANT,
        entityId: input.tenantId,
        entityName: "Tenant Impersonation",
        description: `Super admin started impersonating tenant`,
        metadata: { reason: input.reason },
        tenantId: input.tenantId,
      })

      return impersonation
    }),

  endImpersonation: protectedProcedure
    .input(z.object({ impersonationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const impersonation = await ctx.prisma.tenantImpersonation.findUnique({
        where: { id: input.impersonationId },
      })

      if (!impersonation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Impersonation session not found" })
      }

      const duration = Math.floor((Date.now() - impersonation.startedAt.getTime()) / 1000)

      const updated = await ctx.prisma.tenantImpersonation.update({
        where: { id: input.impersonationId },
        data: {
          endedAt: new Date(),
          duration,
          isActive: false,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: "superadmin",
        action: AuditAction.LOGOUT,
        entityType: AuditEntityType.TENANT,
        entityId: impersonation.tenantId,
        entityName: "Tenant Impersonation",
        description: `Ended impersonation session (duration: ${duration}s)`,
        tenantId: impersonation.tenantId,
      })

      return updated
    }),*/

  // -------------------------------------------------------
  // 📄 LEGAL DOCUMENTS (TERMS & PRIVACY)
  // -------------------------------------------------------
  getLegalDocuments: tenantProcedure
    .use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          termsOfService: true,
          termsVersion: true,
          privacyPolicy: true,
          privacyPolicyVersion: true,
        },
      })

      return tenant
    }),

  updateLegalDocuments: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        termsOfService: z.string().optional(),
        termsVersion: z.string().optional(),
        privacyPolicy: z.string().optional(),
        privacyPolicyVersion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Legal Documents",
        description: "Updated legal documents",
        metadata: {
          hasTerms: !!input.termsOfService,
          hasPrivacy: !!input.privacyPolicy,
        },
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🎨 LOGIN PAGE BRANDING
  // -------------------------------------------------------
  getLoginBranding: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          loginPageConfig: true,
        },
      })

      return tenant?.loginPageConfig || null
    }),

  updateLoginBranding: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))

    .input(
      z.object({
        backgroundImage: z.string().url().optional().nullable(),
        welcomeMessage: z.string().optional().nullable(),
        customCss: z.string().optional().nullable(),
        showLogo: z.boolean().optional(),
        logoPosition: z.enum(["top", "center", "left"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          loginPageConfig: input as any,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Login Page Branding",
        description: "Updated login page branding",
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 🧭 NAVIGATION MENU CONFIG
  // -------------------------------------------------------
  getNavigationConfig: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.READ, PermissionScope.TENANT)))
    .query(async ({ ctx }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: {
          navigationConfig: true,
        },
      })

      return tenant?.navigationConfig || null
    }),

  updateNavigationConfig: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(z.any()) // Accept any JSON structure for navigation config
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          navigationConfig: input,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Navigation Config",
        description: "Updated navigation menu configuration",
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 📧 EMAIL DOMAIN CONFIG
  // -------------------------------------------------------
  updateEmailDomain: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        customEmailDomain: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          customEmailDomain: input.customEmailDomain,
          emailDomainVerified: false, // Reset verification status
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Email Domain",
        description: `Updated email domain to ${input.customEmailDomain}`,
        metadata: input,
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  verifyEmailDomain: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .mutation(async ({ ctx }) => {
      // TODO: Implement actual DNS/email verification
      const updated = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          emailDomainVerified: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: "Email Domain",
        description: "Verified email domain",
        tenantId: ctx.tenantId,
      })

      return updated
    }),

  // -------------------------------------------------------
  // 📝 PDF TEMPLATE UPDATE & DELETE
  // -------------------------------------------------------
  updatePDFTemplate: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.UPDATE, PermissionScope.TENANT)))
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        template: z.string().optional(),
        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),
        pageSize: z.string().optional(),
        orientation: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const template = await ctx.prisma.pDFTemplate.update({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: template.id,
        entityName: "PDF Template",
        description: `Updated PDF template: ${template.name}`,
        tenantId: ctx.tenantId,
      })

      return template
    }),

  deletePDFTemplate: tenantProcedure
.use(hasPermission(buildPermissionKey(Resource.TENANT, Action.DELETE, PermissionScope.TENANT)))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.pDFTemplate.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name!,
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.TENANT,
        entityId: template.id,
        entityName: "PDF Template",
        description: `Deleted PDF template: ${template.name}`,
        tenantId: ctx.tenantId,
      })

      return template
    }),
})
