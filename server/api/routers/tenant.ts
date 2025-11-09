
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
          createdAt: true,
          updatedAt: true,
        },
      })
    }),

  // Update tenant settings (restricted to admins only)
  updateSettings: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Le nom de l'organisation est requis").optional(),
      logoUrl: z.string().url("L'URL du logo doit être valide").optional().nullable(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur primaire doit être au format hexadécimal (#RRGGBB)").optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur d'accent doit être au format hexadécimal (#RRGGBB)").optional(),
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
          action: "reset_colors"
        },
        tenantId: ctx.tenantId,
      })

      return updatedTenant
    }),
})
