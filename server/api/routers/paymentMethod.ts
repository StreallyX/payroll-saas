import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2"

import { TRPCError } from "@trpc/server"
import { PaymentMethodType } from "@prisma/client"


/**
 * Payment Method Router - STRICT RBAC V3
 */
export const paymentMethodRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL PAYMENT METHODS (tenant)
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        ownerId: z.string().optional(),
        ownerType: z.enum(["user", "company", "agency"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId }

      if (input?.ownerId) where.ownerId = input.ownerId
      if (input?.ownerType) where.ownerType = input.ownerType

      return ctx.prisma.paymentMethod.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    }),


  // ---------------------------------------------------------
  // GET BY ID (tenant)
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const pm = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!pm)
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment method not found" })

      return pm
    }),


  // ---------------------------------------------------------
  // CREATE PAYMENT METHOD (tenant)
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.CREATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        ownerId: z.string(),
        ownerType: z.enum(["user", "company", "agency"]),
        type: z.nativeEnum(PaymentMethodType),
        isDefault: z.boolean().default(false),

        // Bank
        bankName: z.string().optional(),
        accountHolderName: z.string().optional(),
        accountNumber: z.string().optional(),
        routingNumber: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),

        // Card
        cardLast4: z.string().optional(),
        cardBrand: z.string().optional(),
        cardExpMonth: z.number().optional(),
        cardExpYear: z.number().optional(),
        cardholderName: z.string().optional(),

        // Gateway
        gatewayType: z.string().optional(),
        gatewayToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      if (input.isDefault) {
        await ctx.prisma.paymentMethod.updateMany({
          where: {
            tenantId: ctx.tenantId,
            ownerId: input.ownerId,
            ownerType: input.ownerType,
          },
          data: { isDefault: false },
        })
      }

      return ctx.prisma.paymentMethod.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      })
    }),


  // ---------------------------------------------------------
  // UPDATE PAYMENT METHOD (tenant)
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        id: z.string(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        isVerified: z.boolean().optional(),

        bankName: z.string().optional(),
        accountHolderName: z.string().optional(),

        cardExpMonth: z.number().optional(),
        cardExpYear: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pm = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!pm)
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment method not found" })

      if (input.isDefault) {
        await ctx.prisma.paymentMethod.updateMany({
          where: {
            tenantId: ctx.tenantId,
            ownerId: pm.ownerId,
            ownerType: pm.ownerType,
            id: { not: input.id },
          },
          data: { isDefault: false },
        })
      }

      return ctx.prisma.paymentMethod.update({
        where: { id: input.id },
        data: input,
      })
    }),


  // ---------------------------------------------------------
  // DELETE PAYMENT METHOD (tenant)
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.DELETE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pm = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!pm)
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment method not found" })

      await ctx.prisma.paymentMethod.delete({ where: { id: input.id } })

      return { success: true }
    }),


  // ---------------------------------------------------------
  // SET DEFAULT (tenant)
  // ---------------------------------------------------------
  setDefault: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pm = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!pm)
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment method not found" })

      await ctx.prisma.paymentMethod.updateMany({
        where: {
          tenantId: ctx.tenantId,
          ownerId: pm.ownerId,
          ownerType: pm.ownerType,
          id: { not: input.id },
        },
        data: { isDefault: false },
      })

      return ctx.prisma.paymentMethod.update({
        where: { id: input.id },
        data: { isDefault: true },
      })
    }),


  // ---------------------------------------------------------
  // VERIFY (tenant)
  // ---------------------------------------------------------
  verify: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.PAYMENT, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pm = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!pm)
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment method not found" })

      return ctx.prisma.paymentMethod.update({
        where: { id: input.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      })
    }),

})
