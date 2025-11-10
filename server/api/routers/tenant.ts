
import { z } from "zod"
import { createTRPCRouter, tenantProcedure, adminProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const tenantRouter = createTRPCRouter({
  // Get current tenant settings (accessible by all authenticated users)
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
          createdAt: true,
          updatedAt: true,
        },
      })
    }),

  // Update tenant settings (restricted to admins only)
  updateSettings: adminProcedure
    .input(z.object({
        name: z.string().min(1).optional(),
        logoUrl: z.string().url().optional().nullable(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // ✅ NEW
        sidebarBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        sidebarTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        headerBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        headerTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
    .mutation(async ({ ctx, input }) => {
      // Get current tenant data for audit log
      const currentTenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { name: true },
      })

      // Update tenant settings
      const updatedTenant = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: input,
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: currentTenant?.name || "Tenant",
        metadata: {
          changes: input,
        },
        tenantId: ctx.tenantId,
      })

      return updatedTenant
    }),

  // Reset colors to default (restricted to admins only)
  resetColors: adminProcedure
    .mutation(async ({ ctx }) => {
      // Get current tenant data for audit log
      const currentTenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { name: true },
      })

      // Reset colors
      const updatedTenant = await ctx.prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          primaryColor: "#3b82f6", // Default blue
          accentColor: "#10b981",  // Default green
          backgroundColor: "#ffffff",
          sidebarBgColor: "#ffffff",
          sidebarTextColor: "#111827",
          headerBgColor: "#ffffff",
          headerTextColor: "#111827",
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TENANT,
        entityId: ctx.tenantId,
        entityName: currentTenant?.name || "Tenant",
        metadata: {
          primaryColor: "#3b82f6",
          accentColor: "#10b981",
          backgroundColor: "#ffffff",
          action: "reset_colors"
        },
        tenantId: ctx.tenantId,
      })

      return updatedTenant
    }),
})
