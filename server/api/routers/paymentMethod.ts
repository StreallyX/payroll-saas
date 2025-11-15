
import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";
import { PaymentMethodType } from "@prisma/client";

/**
 * Payment Method Router - Phase 2
 * 
 * Handles payment method management for companies, contractors, and agencies
 */

export const paymentMethodRouter = createTRPCRouter({
  
  // ---------------------------------------------------------
  // GET ALL PAYMENT METHODS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.view))
    .input(z.object({
      ownerId: z.string().optional(),
      ownerType: z.enum(["user", "company", "agency"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {
        tenantId: ctx.tenantId,
      };

      if (input?.ownerId) {
        where.ownerId = input.ownerId;
      }

      if (input?.ownerType) {
        where.ownerType = input.ownerType;
      }

      const paymentMethods = await ctx.prisma.paymentMethod.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      return paymentMethods;
    }),

  // ---------------------------------------------------------
  // GET PAYMENT METHOD BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found",
        });
      }

      return paymentMethod;
    }),

  // ---------------------------------------------------------
  // CREATE PAYMENT METHOD
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({
      ownerId: z.string(),
      ownerType: z.enum(["user", "company", "agency"]),
      type: z.nativeEnum(PaymentMethodType),
      isDefault: z.boolean().default(false),
      // Bank account fields
      bankName: z.string().optional(),
      accountHolderName: z.string().optional(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      swiftCode: z.string().optional(),
      iban: z.string().optional(),
      // Card fields
      cardLast4: z.string().optional(),
      cardBrand: z.string().optional(),
      cardExpMonth: z.number().optional(),
      cardExpYear: z.number().optional(),
      cardholderName: z.string().optional(),
      // Gateway fields
      gatewayType: z.string().optional(),
      gatewayToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset other default payment methods for this owner
      if (input.isDefault) {
        await ctx.prisma.paymentMethod.updateMany({
          where: {
            tenantId: ctx.tenantId,
            ownerId: input.ownerId,
            ownerType: input.ownerType,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const paymentMethod = await ctx.prisma.paymentMethod.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      });

      return paymentMethod;
    }),

  // ---------------------------------------------------------
  // UPDATE PAYMENT METHOD
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({
      id: z.string(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
      isVerified: z.boolean().optional(),
      // Bank account fields
      bankName: z.string().optional(),
      accountHolderName: z.string().optional(),
      // Card fields
      cardExpMonth: z.number().optional(),
      cardExpYear: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found",
        });
      }

      // If setting as default, unset other default payment methods for this owner
      if (input.isDefault) {
        await ctx.prisma.paymentMethod.updateMany({
          where: {
            tenantId: ctx.tenantId,
            ownerId: paymentMethod.ownerId,
            ownerType: paymentMethod.ownerType,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const updated = await ctx.prisma.paymentMethod.update({
        where: { id },
        data,
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // DELETE PAYMENT METHOD
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found",
        });
      }

      await ctx.prisma.paymentMethod.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // SET AS DEFAULT
  // ---------------------------------------------------------
  setDefault: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found",
        });
      }

      // Unset other default payment methods for this owner
      await ctx.prisma.paymentMethod.updateMany({
        where: {
          tenantId: ctx.tenantId,
          ownerId: paymentMethod.ownerId,
          ownerType: paymentMethod.ownerType,
          id: { not: input.id },
        },
        data: {
          isDefault: false,
        },
      });

      // Set this one as default
      const updated = await ctx.prisma.paymentMethod.update({
        where: { id: input.id },
        data: {
          isDefault: true,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // VERIFY PAYMENT METHOD
  // ---------------------------------------------------------
  verify: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const paymentMethod = await ctx.prisma.paymentMethod.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found",
        });
      }

      // In a real implementation, this would verify the payment method with a payment gateway
      const updated = await ctx.prisma.paymentMethod.update({
        where: { id: input.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      return updated;
    }),
});
