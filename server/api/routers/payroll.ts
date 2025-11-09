
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const payrollRouter = createTRPCRouter({
  // Get all payroll partners for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.payrollPartner.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          contracts: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
          _count: {
            select: { contracts: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get payroll partner by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.payrollPartner.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contracts: {
            include: {
              agency: { select: { name: true } },
              contractor: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
              invoices: true,
            },
          },
        },
      })
    }),

  // Create payroll partner
  create: tenantProcedure
    .input(z.object({
      name: z.string().min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended"]).default("active"),
    }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.prisma.payrollPartner.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: partner.id,
        entityName: partner.name,
        metadata: {
          email: partner.contactEmail,
          status: partner.status,
        },
        tenantId: ctx.tenantId,
      })

      return partner
    }),

  // Update payroll partner
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const partner = await ctx.prisma.payrollPartner.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
        data: updateData,
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: partner.id,
        entityName: partner.name,
        metadata: {
          updatedFields: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return partner
    }),

  // Delete payroll partner
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get partner details before deleting
      const partner = await ctx.prisma.payrollPartner.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!partner) {
        throw new Error("Payroll partner not found")
      }

      const result = await ctx.prisma.payrollPartner.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYROLL_PARTNER,
        entityId: input.id,
        entityName: partner.name,
        metadata: {
          email: partner.contactEmail,
        },
        tenantId: ctx.tenantId,
      })

      return result
    }),

  // Get payroll partner statistics
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const totalPartners = await ctx.prisma.payrollPartner.count({
        where: { tenantId: ctx.tenantId },
      })

      const activePartners = await ctx.prisma.payrollPartner.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "active",
        },
      })

      const inactivePartners = await ctx.prisma.payrollPartner.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "inactive",
        },
      })

      return {
        total: totalPartners,
        active: activePartners,
        inactive: inactivePartners,
      }
    }),
})
