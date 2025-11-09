

import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const companyRouter = createTRPCRouter({
  /**
   * Get all companies
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.company.findMany({
      where: { tenantId: ctx.session?.user?.tenantId || "" },
      include: {
        country: true
      },
      orderBy: { createdAt: "desc" }
    })
  }),

  /**
   * Get single company by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.company.findUnique({
        where: { id: input.id },
        include: { country: true }
      })
    }),

  /**
   * Create a new company
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Organization name is required"),
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
        website: z.string().url().optional().or(z.literal("")),
        status: z.enum(["active", "inactive"]).default("active")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId || ""

      const company = await ctx.prisma.company.create({
        data: {
          ...input,
          tenantId
        }
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COMPANY,
        entityId: company.id,
        entityName: company.name,
        tenantId
      })

      return company
    }),

  /**
   * Update an existing company
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
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
        website: z.string().url().optional().or(z.literal("")),
        status: z.enum(["active", "inactive"]).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const tenantId = ctx.session?.user?.tenantId || ""

      const company = await ctx.prisma.company.update({
        where: { id },
        data
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COMPANY,
        entityId: company.id,
        entityName: company.name,
        tenantId
      })

      return company
    }),

  /**
   * Delete a company
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId || ""
      
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id }
      })

      await ctx.prisma.company.delete({
        where: { id: input.id }
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.COMPANY,
        entityId: input.id,
        entityName: company?.name || "Unknown",
        tenantId
      })

      return { success: true }
    }),

  /**
   * Get company statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session?.user?.tenantId || ""

    const [total, active, inactive] = await Promise.all([
      ctx.prisma.company.count({ where: { tenantId } }),
      ctx.prisma.company.count({ where: { tenantId, status: "active" } }),
      ctx.prisma.company.count({ where: { tenantId, status: "inactive" } })
    ])

    return { total, active, inactive }
  })
})
