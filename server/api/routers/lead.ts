
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const leadRouter = createTRPCRouter({
  /**
   * Get all leads for the current tenant
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.tenantId) {
      throw new Error("Unauthorized")
    }

    return await ctx.prisma.lead.findMany({
      where: {
        tenantId: ctx.session.user.tenantId
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }),

  /**
   * Get a single lead by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.tenantId) {
        throw new Error("Unauthorized")
      }

      return await ctx.prisma.lead.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.session.user.tenantId
        }
      })
    }),

  /**
   * Get lead statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.tenantId) {
      throw new Error("Unauthorized")
    }

    const [total, hot, warm, cold] = await Promise.all([
      ctx.prisma.lead.count({
        where: { tenantId: ctx.session.user.tenantId }
      }),
      ctx.prisma.lead.count({
        where: { tenantId: ctx.session.user.tenantId, status: "hot" }
      }),
      ctx.prisma.lead.count({
        where: { tenantId: ctx.session.user.tenantId, status: "warm" }
      }),
      ctx.prisma.lead.count({
        where: { tenantId: ctx.session.user.tenantId, status: "cold" }
      })
    ])

    return { total, hot, warm, cold }
  }),

  /**
   * Create a new lead
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Company name is required"),
        contact: z.string().min(1, "Contact name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        status: z.enum(["hot", "warm", "cold"]).default("warm"),
        source: z.string().optional(),
        value: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.tenantId) {
        throw new Error("Unauthorized")
      }

      const lead = await ctx.prisma.lead.create({
        data: {
          ...input,
          lastContact: new Date(),
          tenantId: ctx.session.user.tenantId
        }
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LEAD,
        entityId: lead.id,
        entityName: input.name,
        metadata: { leadData: input },
        tenantId: ctx.session?.user?.tenantId
      })

      return lead
    }),

  /**
   * Update an existing lead
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        contact: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        status: z.enum(["hot", "warm", "cold"]).optional(),
        source: z.string().optional(),
        value: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.tenantId) {
        throw new Error("Unauthorized")
      }

      const { id, ...data } = input

      const lead = await ctx.prisma.lead.update({
        where: {
          id,
          tenantId: ctx.session.user.tenantId
        },
        data: {
          ...data,
          lastContact: new Date()
        }
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.LEAD,
        entityId: id,
        entityName: data.name || lead.name,
        metadata: { updates: data },
        tenantId: ctx.session?.user?.tenantId
      })

      return lead
    }),

  /**
   * Delete a lead
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.tenantId) {
        throw new Error("Unauthorized")
      }

      const lead = await ctx.prisma.lead.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.session.user.tenantId
        }
      })

      if (!lead) {
        throw new Error("Lead not found")
      }

      await ctx.prisma.lead.delete({
        where: {
          id: input.id
        }
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "Unknown",
        userRole: ctx.session?.user?.roleName || "unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.LEAD,
        entityId: input.id,
        entityName: lead.name,
        tenantId: ctx.session?.user?.tenantId
      })

      return { success: true }
    }),

  /**
   * Export leads to CSV
   */
  export: protectedProcedure.mutation(async ({ ctx }) => {
    // Create audit log for export
    await createAuditLog({
      userId: ctx.session?.user?.id || "",
      userName: ctx.session?.user?.name || "Unknown",
      userRole: ctx.session?.user?.roleName || "unknown",
      action: AuditAction.EXPORT,
      entityType: AuditEntityType.LEAD,
      metadata: { format: "CSV" },
      tenantId: ctx.session?.user?.tenantId
    })

    return { success: true, message: "Leads exported successfully" }
  })
})
