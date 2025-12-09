import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const apiKeyRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET ALL API KEYS
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
    .input(z.object({ isActive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const apiKeys = await ctx.prisma.apiKey.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          permissions: true,
          rateLimit: true,
          allowedIPs: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
          expiresAt: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          revokedAt: true,
          createdById: true,
          revokedById: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return apiKeys;
    }),

  // ---------------------------------------------------------
  // GET API KEY BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
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
          permissions: true,
          rateLimit: true,
          allowedIPs: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
          expiresAt: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          revokedAt: true,
          createdById: true,
          revokedById: true,
        },
      });

      if (!apiKey) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });

      return apiKey;
    }),

  // ---------------------------------------------------------
  // CREATE API KEY
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission("tenant.users.create.global"))
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      scopes: z.array(z.string()).default([]),
      permissions: z.array(z.string()).default([]),
      rateLimit: z.number().optional(),
      expiresAt: z.date().optional(),
      allowedIPs: z.array(z.string()).default([]),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rawKey = `sk_live_${crypto.randomBytes(32).toString("hex")}`;
      const keyPrefix = rawKey.substring(0, 12);
      const hashed = await bcrypt.hash(rawKey, 10);

      const apiKey = await ctx.prisma.apiKey.create({
        data: {
          tenantId: ctx.tenantId,
          createdById: ctx.session.user.id,
          name: input.name,
          description: input.description,
          key: hashed,
          keyPrefix,
          scopes: input.scopes,
          permissions: input.permissions,
          rateLimit: input.rateLimit,
          expiresAt: input.expiresAt,
          allowedIPs: input.allowedIPs,
          metadata: input.metadata,
        },
      });

      return { ...apiKey, rawKey };
    }),

  // ---------------------------------------------------------
  // UPDATE API KEY
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      scopes: z.array(z.string()).optional(),
      permissions: z.array(z.string()).optional(),
      rateLimit: z.number().optional(),
      expiresAt: z.date().optional(),
      allowedIPs: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.apiKey.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });

      return ctx.prisma.apiKey.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          permissions: true,
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
    }),

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });

      await ctx.prisma.apiKey.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // REVOKE (SOFT DELETE)
  // ---------------------------------------------------------
  revoke: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });

      if (apiKey.revokedAt)
        throw new TRPCError({ code: "BAD_REQUEST", message: "API key already revoked" });

      return ctx.prisma.apiKey.update({
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
          revokedById: true,
        },
      });
    }),

  // ---------------------------------------------------------
  // REGENERATE (NEW KEY, KEEP SAME RECORD)
  // ---------------------------------------------------------
  regenerate: tenantProcedure
    .use(hasPermission("tenant.users.update.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!apiKey) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });

      const rawKey = `sk_live_${crypto.randomBytes(32).toString("hex")}`;
      const keyPrefix = rawKey.substring(0, 12);
      const hashed = await bcrypt.hash(rawKey, 10);

      const updated = await ctx.prisma.apiKey.update({
        where: { id: input.id },
        data: {
          key: hashed,
          keyPrefix,
          usageCount: 0,
          lastUsedAt: null,
        },
      });

      return { ...updated, rawKey };
    }),
});
