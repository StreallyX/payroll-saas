import { z } from "zod"
import { createTRPCRouter, tenantProcedure, adminProcedure, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"

// ==========================================
// 🌍 TENANT ADMIN ROUTES (pour admins internes)
// ==========================================

export const tenantRouter = createTRPCRouter({
  // 🟢 Obtenir les infos du tenant courant
  getCurrent: tenantProcedure.query(async ({ ctx }) => {
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
        createdAt: true,
        updatedAt: true,
      },
    })
  }),

  // 🟦 Mise à jour des paramètres du tenant (Admin)
  updateSettings: adminProcedure
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentTenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { name: true },
      })

      const updatedTenant = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: currentTenant?.name || "Tenant",
        metadata: { changes: input },
        tenantId: ctx.tenantId,
      })

      return updatedTenant
    }),

  // 🟧 Réinitialisation des couleurs du tenant
  resetColors: adminProcedure.mutation(async ({ ctx }) => {
    const currentTenant = await ctx.prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { name: true },
    })

    const updatedTenant = await ctx.prisma.tenant.update({
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
      userId: ctx.session.user.id,
      userName: ctx.session.user.name || "Unknown",
      userRole: ctx.session.user.roleName || "Unknown",
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TENANT,
      entityId: ctx.tenantId,
      entityName: currentTenant?.name || "Tenant",
      metadata: { action: "reset_colors" },
      tenantId: ctx.tenantId,
    })

    return updatedTenant
  }),

  // ==========================================
  // 🔐 SUPERADMIN-ONLY ROUTES
  // ==========================================

  // 📊 Liste optimisée des tenants
  getAllForSuperAdmin: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.isSuperAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "SuperAdmin access required" })
    }

    const tenants = await ctx.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            contracts: true,
            invoices: true,
          },
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
      isActive: (t as any).isActive ?? true,
    }))
  }),

  // 🏗️ Créer un tenant + admin
  createTenantWithAdmin: protectedProcedure
    .input(
      z.object({
        tenantName: z.string().min(2),
        primaryColor: z.string().optional().default("#3b82f6"),
        accentColor: z.string().optional().default("#10b981"),
        adminName: z.string().min(2),
        adminEmail: z.string().email(),
        adminPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.isSuperAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "SuperAdmin access required" })
      }

      const existingUser = await ctx.prisma.user.findFirst({
        where: { email: input.adminEmail },
      })

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet email est déjà utilisé par un autre compte",
        })
      }

      const result = await ctx.prisma.$transaction(async (prisma) => {
        const tenant = await prisma.tenant.create({
          data: {
            name: input.tenantName,
            primaryColor: input.primaryColor,
            accentColor: input.accentColor,
            isActive: true,
          },
        })

        // Crée les 4 rôles de base
        const roleNames = ["admin", "agency", "contractor", "payroll_partner"]
        const roles = await Promise.all(
          roleNames.map((name) =>
            prisma.role.create({
              data: { tenantId: tenant.id, name },
            })
          )
        )

        const adminRole = roles.find((r) => r.name === "admin")!
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

        // ✅ Audit log
        await prisma.auditLog.create({
          data: {
            ...(ctx.session.user?.isSuperAdmin ? {} : { userId: ctx.session.user?.id }),
            userName: ctx.session.user?.name ?? "SuperAdmin",
            userRole: "superadmin",
            action: "CREATE",
            entityType: "TENANT",
            entityId: tenant.id,
            entityName: tenant.name,
            description: `Tenant créé avec admin ${input.adminEmail}`,
            tenantId: tenant.id,
          } as Prisma.AuditLogUncheckedCreateInput, // ✅ le cast propre
        })

        return { tenant, user }
      })

      return result
    }),

  // ⚙️ Activer / Désactiver un tenant
  updateTenantStatus: protectedProcedure
    .input(z.object({ tenantId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.isSuperAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "SuperAdmin access required" })
      }

      const tenant = await ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { isActive: input.isActive, updatedAt: new Date() },
      })

      await ctx.prisma.auditLog.create({
        data: {
          ...(ctx.session.user?.isSuperAdmin ? {} : { userId: ctx.session.user?.id }),
          userName: ctx.session.user?.name ?? "SuperAdmin",
          userRole: "superadmin",
          action: input.isActive ? "ACTIVATE" : "DEACTIVATE",
          entityType: "TENANT",
          entityId: tenant.id,
          entityName: tenant.name,
          description: `Tenant ${input.isActive ? "activé" : "désactivé"}`,
          tenantId: tenant.id,
        } as Prisma.AuditLogUncheckedCreateInput,
      })

      return tenant
    }),

  // 🗑️ Désactivation logique (soft delete)
  deleteTenant: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.isSuperAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "SuperAdmin access required" })
      }

      const tenant = await ctx.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { isActive: false, updatedAt: new Date() },
      })

      await ctx.prisma.auditLog.create({
        data: {
          ...(ctx.session.user?.isSuperAdmin ? {} : { userId: ctx.session.user?.id }),
          userName: ctx.session.user?.name ?? "SuperAdmin",
          userRole: "superadmin",
          action: "DELETE",
          entityType: "TENANT",
          entityId: tenant.id,
          entityName: tenant.name,
          description: "Tenant désactivé (soft delete)",
          tenantId: tenant.id,
        } as Prisma.AuditLogUncheckedCreateInput,
      })

      return tenant
    }),
})
