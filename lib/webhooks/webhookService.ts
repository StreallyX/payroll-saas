
/**
 * Webhook System
 * Handles webhook delivery with retry logic and event subscriptions
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';
import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  tenantId?: string;
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  headers?: Record<string, string>;
}

export interface WebhookDeliveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface WebhookJobData {
  subscriptionId: string;
  url: string;
  payload: WebhookPayload;
  secret: string;
  headers?: Record<string, string>;
  attempt?: number;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  deliveredAt?: string;
}

// Webhook event types
export const WebhookEvents = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Contractor events
  CONTRACTOR_CREATED: 'contractor.created',
  CONTRACTOR_UPDATED: 'contractor.updated',
  CONTRACTOR_ONBOARDED: 'contractor.onboarded',
  
  // Contract events
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_UPDATED: 'contract.updated',
  CONTRACT_SIGNED: 'contract.signed',
  CONTRACT_TERMINATED: 'contract.terminated',
  
  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  
  // Payroll events
  PAYROLL_GENERATED: 'payroll.generated',
  PAYROLL_PROCESSED: 'payroll.processed',
  PAYSLIP_GENERATED: 'payslip.generated',
  
  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  
  // Task events
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  
  // Approval events
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
} as const;

class WebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();

  constructor() {
    // Register webhook worker
    this.registerWebhookWorker();
  }

  /**
   * Register webhook processing worker
   */
  private registerWebhookWorker() {
    registerWorker<WebhookJobData, WebhookResult>(
      QueueNames.WEBHOOK,
      async (job: Job<WebhookJobData>) => {
        return this.processWebhookJob(job);
      },
      {
        concurrency: 20,
        limiter: {
          max: 1000,
          duration: 60000, // 1000 webhooks per minute
        },
      }
    );
  }

  /**
   * Process webhook delivery job
   */
  private async processWebhookJob(job: Job<WebhookJobData>): Promise<WebhookResult> {
    const { url, payload, secret, headers, attempt = 1 } = job.data;

    try {
      // Generate signature for webhook verification
      const signature = this.generateSignature(payload, secret);

      // Prepare headers
      const webhookHeaders = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'X-Webhook-Attempt': attempt.toString(),
        'User-Agent': 'PayrollSaaS-Webhooks/1.0',
        ...headers,
      };

      // Send webhook
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: webhookHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const duration = Date.now() - startTime;
      const responseData = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData}`);
      }

      logger.info('Webhook delivered successfully', {
        url,
        event: payload.event,
        statusCode: response.status,
        duration: `${duration}ms`,
        attempt,
      });

      return {
        success: true,
        statusCode: response.status,
        response: responseData,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Webhook delivery failed', {
        url,
        event: payload.event,
        error,
        attempt,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Register a webhook subscription
   */
  registerSubscription(subscription: WebhookSubscription): void {
    this.subscriptions.set(subscription.id, subscription);
    logger.info('Webhook subscription registered', {
      id: subscription.id,
      url: subscription.url,
      events: subscription.events,
      tenantId: subscription.tenantId,
    });
  }

  /**
   * Unregister a webhook subscription
   */
  unregisterSubscription(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    logger.info('Webhook subscription unregistered', { id: subscriptionId });
  }

  /**
   * Trigger a webhook event
   */
  async trigger(
    event: string,
    data: any,
    tenantId?: string,
    options?: WebhookDeliveryOptions
  ): Promise<Job[]> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      tenantId,
    };

    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) =>
        sub.isActive &&
        sub.events.includes(event) &&
        (!tenantId || sub.tenantId === tenantId)
    );

    if (matchingSubscriptions.length === 0) {
      logger.debug('No webhook subscriptions found for event', {
        event,
        tenantId,
      });
      return [];
    }

    // Queue webhook deliveries
    const jobs = await Promise.all(
      matchingSubscriptions.map((sub) =>
        addJob(
          QueueNames.WEBHOOK,
          'deliver-webhook',
          {
            subscriptionId: sub.id,
            url: sub.url,
            payload,
            secret: sub.secret,
            headers: sub.headers,
            attempt: 1,
          },
          {
            attempts: options?.maxRetries || 3,
            backoff: {
              type: 'exponential',
              delay: options?.retryDelay || 2000,
            },
          }
        )
      )
    );

    logger.info('Webhook event triggered', {
      event,
      tenantId,
      subscriptionCount: matchingSubscriptions.length,
    });

    return jobs;
  }

  /**
   * Trigger multiple webhook events in batch
   */
  async triggerBatch(
    events: Array<{ event: string; data: any; tenantId?: string }>,
    options?: WebhookDeliveryOptions
  ): Promise<Job[][]> {
    return Promise.all(
      events.map((e) => this.trigger(e.event, e.data, e.tenantId, options))
    );
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): WebhookSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all subscriptions for a tenant
   */
  getTenantSubscriptions(tenantId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.tenantId === tenantId
    );
  }

  /**
   * Get all subscriptions for an event
   */
  getEventSubscriptions(event: string, tenantId?: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) =>
        sub.isActive &&
        sub.events.includes(event) &&
        (!tenantId || sub.tenantId === tenantId)
    );
  }

  /**
   * Test webhook subscription (send a test event)
   */
  async testSubscription(subscriptionId: string): Promise<WebhookResult> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error('Webhook subscription not found');
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook event',
        subscriptionId,
      },
      timestamp: new Date().toISOString(),
      tenantId: subscription.tenantId,
    };

    const job = await addJob<WebhookJobData>(QueueNames.WEBHOOK, 'test-webhook', {
      subscriptionId: subscription.id,
      url: subscription.url,
      payload: testPayload,
      secret: subscription.secret,
      headers: subscription.headers,
      attempt: 1,
    });

    // Wait for job to complete
    await job.waitUntilFinished(queueManager.getQueue(QueueNames.WEBHOOK).events);
    
    const result = job.returnvalue as WebhookResult;
    return result;
  }
}

// Singleton instance
export const webhookService = new WebhookService();

// Re-export for utility functions
import { queueManager } from '../queue';

/**
 * Helper function to trigger a webhook
 */
export async function triggerWebhook(
  event: string,
  data: any,
  tenantId?: string
): Promise<Job[]> {
  return webhookService.trigger(event, data, tenantId);
}

/**
 * Helper to register webhook subscription
 */
export function registerWebhook(subscription: WebhookSubscription): void {
  webhookService.registerSubscription(subscription);
}
