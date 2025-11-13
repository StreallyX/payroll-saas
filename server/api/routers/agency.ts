
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { sanitizeData } from "@/lib/utils"

export const agencyRouter = createTRPCRouter({
  // Get all agencies for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.agency.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          country: true,
          contractors: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          contracts: true,
          _count: {
            select: {
              contractors: true,
              contracts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get agency by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agency.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contractors: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          contracts: {
            include: {
              contractor: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
              payrollPartner: {
                select: { name: true },
              },
            },
          },
        },
      })
    }),

  // Create agency
  create: tenantProcedure
    .input(z.object({
      // Contact Details
      name: z.string().min(1),
      contactPhone: z.string().optional(),
      alternateContactPhone: z.string().optional(),
      contactEmail: z.union([z.string().email(), z.literal(""), z.undefined()]).optional(),
      primaryContactName: z.string().optional(),
      primaryContactJobTitle: z.string().optional(),
      fax: z.string().optional(),
      notes: z.string().optional(),
      
      // Address Details
      officeBuilding: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      countryId: z.string().optional(),
      state: z.string().optional(),
      postCode: z.string().optional(),
      
      // Invoice Details
      invoicingContactName: z.string().optional(),
      invoicingContactPhone: z.string().optional(),
      invoicingContactEmail: z.string().optional(),
      alternateInvoicingEmail: z.string().optional(),
      vatNumber: z.string().optional(),
      website: z.string().optional(),
      
      status: z.enum(["active", "inactive", "suspended"]).default("active"),
    }))
    .mutation(async ({ ctx, input }) => {
      const cleanData = sanitizeData(input)

      // 🩹 On s'assure que name est bien une string (Zod garantit déjà qu'elle existe)
      const agency = await ctx.prisma.agency.create({
        data: {
          ...(cleanData as any), // on "force" le type nettoyé
          name: input.name, // garanti non undefined
          tenantId: ctx.tenantId,
        },
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
        tenantId: ctx.tenantId
      })

      return agency
    }),

  // Update agency
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      
      // Contact Details
      name: z.string().min(1).optional(),
      contactPhone: z.string().optional(),
      alternateContactPhone: z.string().optional(),
      contactEmail: z.union([z.string().email(), z.literal(""), z.undefined()]).optional(),
      primaryContactName: z.string().optional(),
      primaryContactJobTitle: z.string().optional(),
      fax: z.string().optional(),
      notes: z.string().optional(),
      
      // Address Details
      officeBuilding: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      countryId: z.string().optional(),
      state: z.string().optional(),
      postCode: z.string().optional(),
      
      // Invoice Details
      invoicingContactName: z.string().optional(),
      invoicingContactPhone: z.string().optional(),
      invoicingContactEmail: z.string().optional(),
      alternateInvoicingEmail: z.string().optional(),
      vatNumber: z.string().optional(),
      website: z.string().optional(),
      
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const cleanData = sanitizeData(updateData)

      const agency = await ctx.prisma.agency.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
        data: cleanData,
      })


      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
        tenantId: ctx.tenantId
      })

      return agency
    }),

  // Delete agency
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agency = await ctx.prisma.agency.findUnique({
        where: { id: input.id }
      })

      await ctx.prisma.agency.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.AGENCY,
        entityId: input.id,
        entityName: agency?.name || "Unknown",
        tenantId: ctx.tenantId
      })

      return { success: true }
    }),

  // Get agency statistics
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const totalAgencies = await ctx.prisma.agency.count({
        where: { tenantId: ctx.tenantId },
      })

      const activeAgencies = await ctx.prisma.agency.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "active",
        },
      })

      const inactiveAgencies = await ctx.prisma.agency.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "inactive",
        },
      })

      return {
        total: totalAgencies,
        active: activeAgencies,
        inactive: inactiveAgencies,
      }
    }),
})
