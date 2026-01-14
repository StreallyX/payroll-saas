import { z } from "zod"
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  hasPermission
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const countryRouter = createTRPCRouter({

  // -------------------------------------------------------
  // PUBLIC — LIST ACTIVE COUNTRIES
  // -------------------------------------------------------
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
  }),

  // -------------------------------------------------------
  // PUBLIC — GET BY ID
  // -------------------------------------------------------
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.country.findUnique({
        where: { id: input.id },
      })
    }),

  // -------------------------------------------------------
  // CREATE COUNTRY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  create: protectedProcedure
    .use(hasPermission("country.create.global"))
    .input(
      z.object({
        code: z.string().length(2, "Code must be 2 characters (e.g., US)").transform(val => val.toUpperCase()),
        name: z.string().min(1, "Country name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingCountry = await ctx.prisma.country.findUnique({
        where: { code: input.code },
      });

      if (existingCountry) {
        throw new Error(`Country with code ${input.code} already exists`);
      }

      const country = await ctx.prisma.country.create({
        data: input,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.COUNTRY,
        entityId: country.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: { code: country.code },
      })

      return country
    }),

  // -------------------------------------------------------
  // UPDATE COUNTRY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  update: protectedProcedure
    .use(hasPermission("country.update.global"))
    .input(
      z.object({
        id: z.string(),
        code: z.string().length(2).optional().transform(val => val?.toUpperCase()),
        name: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const country = await ctx.prisma.country.update({
        where: { id },
        data,
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.COUNTRY,
        entityId: country.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: { updatedFields: data },
      })

      return country
    }),

  // -------------------------------------------------------
  // DELETE COUNTRY (SUPERADMIN ONLY)
  // -------------------------------------------------------
  delete: protectedProcedure
    .use(hasPermission("country.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const country = await ctx.prisma.country.findUnique({
        where: { id: input.id },
      })

      if (!country) throw new Error("Country not found")

      await ctx.prisma.country.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.COUNTRY,
        entityId: input.id,
        entityName: `${country.code} - ${country.name}`,
        metadata: { code: country.code },
      })

      return { success: true }
    }),
})
