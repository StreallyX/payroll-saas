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
import { PERMISSION_TREE } from "../../rbac/permissions"

export const tenantRouter = createTRPCRouter({

  // -------------------------------------------------------
  // 🟢 GET CURRENT TENANT
  // -------------------------------------------------------
  getCurrent: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.view))
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
          createdAt: true,
          updatedAt: true,
        },
      })
    }),

  // -------------------------------------------------------
  // 🟦 UPDATE TENANT SETTINGS
  // -------------------------------------------------------
  updateSettings: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.update))
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
    .use(hasPermission(PERMISSION_TREE.tenant.update))
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
    .use(hasPermission(PERMISSION_TREE.superadmin.tenants.create))
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
    .use(hasPermission(PERMISSION_TREE.superadmin.tenants.create))
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
            prisma.role.create({ data: { tenantId: tenant.id, name } })
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
    .use(hasPermission(PERMISSION_TREE.superadmin.tenants.suspend))
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
    .use(hasPermission(PERMISSION_TREE.superadmin.tenants.delete))
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
})
