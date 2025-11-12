

import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const countryRouter = createTRPCRouter({
  /**
   * Get all active countries (public - no auth needed)
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    })
  }),

  /**
   * Get single country by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.country.findUnique({
        where: { id: input.id }
      })
    }),

  /**
   * Create a new country (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().length(2, "Code must be 2 characters (e.g., US)"),
        name: z.string().min(1, "Country name is required")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const country = await ctx.prisma.country.create({
        data: input
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COUNTRY,
        entityId: country.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: {
          code: country.code,
        },
        tenantId: ctx.session.user.tenantId ?? undefined,
      })

      return country
    }),

  /**
   * Update an existing country (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().length(2).optional(),
        name: z.string().min(1).optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const country = await ctx.prisma.country.update({
        where: { id },
        data
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COUNTRY,
        entityId: country.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: {
          updatedFields: data,
        },
        tenantId: ctx.session.user.tenantId ?? undefined,
      })

      return country
    }),

  /**
   * Delete a country (admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get country details before deleting
      const country = await ctx.prisma.country.findUnique({
        where: { id: input.id }
      })

      if (!country) {
        throw new Error("Country not found")
      }

      await ctx.prisma.country.delete({
        where: { id: input.id }
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.COUNTRY,
        entityId: input.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: {
          code: country.code,
        },
        tenantId: ctx.session.user.tenantId ?? undefined,
      })

      return { success: true }
    })
})
