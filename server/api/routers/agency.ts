import { z } from "zod"
import {
  createTRPCRouter,
  hasPermission,
  tenantProcedure,
} from "@/server/api/trpc"
import { PERMISSIONS } from "@/server/rbac/permissions"

export const agencyRouter = createTRPCRouter({

  // 📌 GET ALL AGENCIES
  getAll: hasPermission(PERMISSIONS.AGENCIES_VIEW)
    .query(async ({ ctx }) => {
      return ctx.prisma.agency.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          contractors: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    }),

  // 📌 GET ONE
  getById: hasPermission(PERMISSIONS.AGENCIES_VIEW)
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agency.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          contractors: true,
        }
      })
    }),

  // ➕ CREATE
  create: hasPermission(PERMISSIONS.AGENCIES_CREATE)
    .input(
      z.object({
        name: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        address1: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        postCode: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.agency.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })
    }),

  // ✏️ UPDATE
  update: hasPermission(PERMISSIONS.AGENCIES_UPDATE)
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address1: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        postCode: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input

      return ctx.prisma.agency.update({
        where: {
          id,
        },
        data: rest,
      })
    }),

  // 🗑 DELETE
  delete: hasPermission(PERMISSIONS.AGENCIES_DELETE)
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.agency.delete({
        where: { id: input.id },
      })
    }),
})
