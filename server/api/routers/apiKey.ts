
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE } from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * API Key Router - Phase 2
 * 
 * Handles API key management for external integrations
 */

export const apiKeyRouter = createTRPCRouter({
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {
        tenantId: ctx.tenantId,
      };

      if (input?.isActive !== undefined) {
        where.isActive = input.isActive;
      }

      const apiKeys = await ctx.prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
          expiresAt: true,
          allowedIPs: true,
          createdAt: true,
          updatedAt: true,
          revokedAt: true,
          // Exclude the actual key hash
        },
        orderBy: { createdAt: "desc" },
      });

      return apiKeys;
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
          expiresAt: true,
          allowedIPs: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          revokedAt: true,
          // Exclude the actual key hash
        },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      return apiKey;
    }),

  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      scopes: z.array(z.string()).default([]),
      rateLimit: z.number().optional(),
      expiresAt: z.date().optional(),
      allowedIPs: z.array(z.string()).default([]),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate a random API key
      const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
      const keyPrefix = rawKey.substring(0, 12);

      // Hash the key for storage
      const hashedKey = await bcrypt.hash(rawKey, 10);

      const apiKey = await ctx.prisma.apiKey.create({
        data: {
          name: input.name,
          description: input.description,
          key: hashedKey,
          keyPrefix,
          scopes: input.scopes,
          rateLimit: input.rateLimit,
          expiresAt: input.expiresAt,
          allowedIPs: input.allowedIPs,
          metadata: input.metadata,
          tenantId: ctx.tenantId,
          createdById: ctx.session.user.id,
        },
      });

      // Return the raw key ONLY ONCE - it will never be shown again
      return {
        ...apiKey,
        rawKey, // Only returned on creation
      };
    }),

  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      scopes: z.array(z.string()).optional(),
      rateLimit: z.number().optional(),
      expiresAt: z.date().optional(),
      allowedIPs: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      const updated = await ctx.prisma.apiKey.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
          expiresAt: true,
          allowedIPs: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    }),

  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      await ctx.prisma.apiKey.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  revoke: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      if (apiKey.revokedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API key is already revoked",
        });
      }

      const updated = await ctx.prisma.apiKey.update({
        where: { id: input.id },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedById: ctx.session.user.id,
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          isActive: true,
          revokedAt: true,
        },
      });

      return updated;
    }),

  regenerate: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.tenant.users.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      // Generate a new API key
      const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
      const keyPrefix = rawKey.substring(0, 12);

      // Hash the new key
      const hashedKey = await bcrypt.hash(rawKey, 10);

      const updated = await ctx.prisma.apiKey.update({
        where: { id: input.id },
        data: {
          key: hashedKey,
          keyPrefix,
          usageCount: 0,
          lastUsedAt: null,
        },
      });

      // Return the raw key ONLY ONCE
      return {
        ...updated,
        rawKey,
      };
    }),
});
