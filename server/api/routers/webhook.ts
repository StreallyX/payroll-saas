/**
 * Webhook Management Router (Permissions V3)
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { webhookService, WebhookEvents } from "@/lib/webhooks";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// PERMISSIONS V3
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";

const VIEW = buildPermissionKey(Resource.SETTINGS, Action.READ, PermissionScope.GLOBAL);
const UPDATE = buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.GLOBAL);

export const webhookRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // LIST SUBSCRIPTIONS
  // ---------------------------------------------------------
  list: tenantProcedure
    .use(hasPermission(VIEW))
    .query(async ({ ctx }) => {
      const subscriptions = await ctx.prisma.webhookSubscription.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: subscriptions };
    }),

  // ---------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.webhookSubscription.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
        include: {
          deliveryLogs: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook subscription not found",
        });
      }

      return { success: true, data: subscription };
    }),

  // ---------------------------------------------------------
  // CREATE SUBSCRIPTION
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const secret = crypto.randomBytes(32).toString("hex");

      const subscription = await ctx.prisma.webhookSubscription.create({
        data: {
          tenantId: ctx.tenantId!,
          url: input.url,
          events: input.events,
          secret,
          headers: input.headers,
          isActive: true,
        },
      });

      webhookService.registerSubscription({
        id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        isActive: subscription.isActive,
        headers: subscription.headers as Record<string, string> | undefined,
      });

      return { success: true, data: subscription };
    }),

  // ---------------------------------------------------------
  // UPDATE SUBSCRIPTION
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(
      z.object({
        id: z.string(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        headers: z.record(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const subscription = await ctx.prisma.webhookSubscription.update({
        where: {
          id,
          tenantId: ctx.tenantId!,
        },
        data,
      });

      webhookService.registerSubscription({
        id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        isActive: subscription.isActive,
        headers: subscription.headers as Record<string, string> | undefined,
      });

      return { success: true, data: subscription };
    }),

  // ---------------------------------------------------------
  // DELETE SUBSCRIPTION
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.webhookSubscription.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      webhookService.unregisterSubscription(input.id);

      return { success: true };
    }),

  // ---------------------------------------------------------
  // TEST DELIVERY
  // ---------------------------------------------------------
  test: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.webhookSubscription.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook subscription not found",
        });
      }

      webhookService.registerSubscription({
        id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        isActive: subscription.isActive,
        headers: subscription.headers as Record<string, string> | undefined,
      });

      const result = await webhookService.testSubscription(input.id);

      await ctx.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          event: "webhook.test",
          payload: {
            message: "This is a test webhook event",
            subscriptionId: subscription.id,
          },
          statusCode: result.statusCode,
          response: result.response ? String(result.response) : null,
          success: result.success,
          deliveredAt: result.deliveredAt ? new Date(result.deliveredAt) : null,
        },
      });

      return { success: true, data: result };
    }),

  // ---------------------------------------------------------
  // DELIVERY LOGS
  // ---------------------------------------------------------
  deliveryLogs: tenantProcedure
    .use(hasPermission(VIEW))
    .input(
      z.object({
        subscriptionId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { subscriptionId, page, pageSize } = input;

      const subscription = await ctx.prisma.webhookSubscription.findFirst({
        where: {
          id: subscriptionId,
          tenantId: ctx.tenantId!,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook subscription not found",
        });
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.webhookDelivery.findMany({
          where: { subscriptionId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.webhookDelivery.count({
          where: { subscriptionId },
        }),
      ]);

      return {
        success: true,
        data: {
          items: logs,
          pagination: {
            page,
            pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
            hasNext: page < Math.ceil(total / pageSize),
            hasPrevious: page > 1,
          },
        },
      };
    }),

  // ---------------------------------------------------------
  // AVAILABLE EVENTS
  // ---------------------------------------------------------
  availableEvents: tenantProcedure
    .use(hasPermission(VIEW))
    .query(() => {
      const events = Object.entries(WebhookEvents).map(([key, value]) => ({
        key,
        value,
        category: value.split(".")[0],
        action: value.split(".")[1],
      }));

      const grouped = events.reduce((acc, event) => {
        if (!acc[event.category]) acc[event.category] = [];
        acc[event.category].push(event);
        return acc;
      }, {} as Record<string, typeof events>);

      return { success: true, data: grouped };
    }),

  // ---------------------------------------------------------
  // REGENERATE SECRET
  // ---------------------------------------------------------
  regenerateSecret: tenantProcedure
    .use(hasPermission(UPDATE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const newSecret = crypto.randomBytes(32).toString("hex");

      const subscription = await ctx.prisma.webhookSubscription.update({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
        data: { secret: newSecret },
      });

      webhookService.registerSubscription({
        id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        isActive: subscription.isActive,
        headers: subscription.headers as Record<string, string> | undefined,
      });

      return { success: true, data: { secret: newSecret } };
    }),
});
