
/**
 * Webhook Management Router
 * Handles webhook subscription CRUD and delivery tracking
 */

import { z } from 'zod';
import { createTRPCRouter, tenantProcedure, hasPermission } from '../trpc';
import { webhookService, WebhookEvents } from '@/lib/webhooks';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

export const webhookRouter = createTRPCRouter({
  /**
   * List all webhook subscriptions for the tenant
   */
  list: tenantProcedure
    .use(hasPermission('settings.view'))
    .query(async ({ ctx }) => {
      const subscriptions = await ctx.prisma.webhookSubscription.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: subscriptions };
    }),

  /**
   * Get a single webhook subscription
   */
  getById: tenantProcedure
    .use(hasPermission('settings.view'))
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
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook subscription not found',
        });
      }

      return { success: true, data: subscription };
    }),

  /**
   * Create a new webhook subscription
   */
  create: tenantProcedure
    .use(hasPermission('settings.update'))
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a secure secret for webhook signature
      const secret = crypto.randomBytes(32).toString('hex');

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

      // Register with webhook service
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

  /**
   * Update a webhook subscription
   */
  update: tenantProcedure
    .use(hasPermission('settings.update'))
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

      // Update webhook service
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

  /**
   * Delete a webhook subscription
   */
  delete: tenantProcedure
    .use(hasPermission('settings.update'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.webhookSubscription.delete({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
      });

      // Unregister from webhook service
      webhookService.unregisterSubscription(input.id);

      return { success: true };
    }),

  /**
   * Test a webhook subscription
   */
  test: tenantProcedure
    .use(hasPermission('settings.update'))
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
          code: 'NOT_FOUND',
          message: 'Webhook subscription not found',
        });
      }

      // Register if not in service
      webhookService.registerSubscription({
        id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        isActive: subscription.isActive,
        headers: subscription.headers as Record<string, string> | undefined,
      });

      // Test the webhook
      const result = await webhookService.testSubscription(input.id);

      // Log the delivery
      await ctx.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          event: 'webhook.test',
          payload: {
            message: 'This is a test webhook event',
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

  /**
   * Get delivery logs for a webhook subscription
   */
  deliveryLogs: tenantProcedure
    .use(hasPermission('settings.view'))
    .input(
      z.object({
        subscriptionId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { subscriptionId, page, pageSize } = input;

      // Verify subscription belongs to tenant
      const subscription = await ctx.prisma.webhookSubscription.findFirst({
        where: {
          id: subscriptionId,
          tenantId: ctx.tenantId!,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook subscription not found',
        });
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.webhookDelivery.findMany({
          where: { subscriptionId },
          orderBy: { createdAt: 'desc' },
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

  /**
   * Get available webhook events
   */
  availableEvents: tenantProcedure
    .use(hasPermission('settings.view'))
    .query(() => {
      const events = Object.entries(WebhookEvents).map(([key, value]) => ({
        key,
        value,
        category: value.split('.')[0],
        action: value.split('.')[1],
      }));

      // Group by category
      const grouped = events.reduce((acc, event) => {
        if (!acc[event.category]) {
          acc[event.category] = [];
        }
        acc[event.category].push(event);
        return acc;
      }, {} as Record<string, typeof events>);

      return { success: true, data: grouped };
    }),

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: tenantProcedure
    .use(hasPermission('settings.update'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const newSecret = crypto.randomBytes(32).toString('hex');

      const subscription = await ctx.prisma.webhookSubscription.update({
        where: {
          id: input.id,
          tenantId: ctx.tenantId!,
        },
        data: {
          secret: newSecret,
        },
      });

      // Update webhook service
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
