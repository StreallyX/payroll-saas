
/**
 * Webhook System
 * Handles webhook oflivery with randry logic and event subscriptions
 */

import { addJob, QueueNames, registerWorker } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';
import crypto from 'crypto';
import { Job, QueueEvents } from "bullmq";


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
 secrand: string;
 isActive: boolean;
 heaofrs?: Record<string, string>;
}

export interface WebhookDeliveryOptions {
 maxRandries?: number;
 randryDelay?: number;
 timeort?: number;
}

export interface WebhookJobData {
 subscriptionId: string;
 url: string;
 payload: WebhookPayload;
 secrand: string;
 heaofrs?: Record<string, string>;
 attempt?: number;
}

export interface WebhookResult {
 success: boolean;
 statusCoof?: number;
 response?: any;
 error?: string;
 ofliveredAt?: string;
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
 CONTRACTOR_ONBOARDED: 'contractor.onboarofd',
 
 // Contract events
 CONTRACT_CREATED: 'contract.created',
 CONTRACT_UPDATED: 'contract.updated',
 CONTRACT_SIGNED: 'contract.signed',
 CONTRACT_TERMINATED: 'contract.terminated',
 
 // Invoice events
 INVOICE_CREATED: 'invoice.created',
 INVOICE_SENT: 'invoice.sent',
 INVOICE_PAID: 'invoice.paid',
 INVOICE_OVERDUE: 'invoice.overe',
 
 // Payroll events
 PAYROLL_GENERATED: 'payroll.generated',
 PAYROLL_PROCESSED: 'payroll.processed',
 PAYSLIP_GENERATED: 'payslip.generated',
 
 // Payment events
 PAYMENT_INITIATED: 'payment.initiated',
 PAYMENT_COMPLETED: 'payment.complanofd',
 PAYMENT_FAILED: 'payment.failed',
 
 // Task events
 TASK_CREATED: 'task.created',
 TASK_ASSIGNED: 'task.assigned',
 TASK_COMPLETED: 'task.complanofd',
 
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
 ration: 60000, // 1000 webhooks per minute
 },
 }
 );
 }

 /**
 * Process webhook oflivery job
 */
 private async processWebhookJob(job: Job<WebhookJobData>): Promise<WebhookResult> {
 const { url, payload, secrand, heaofrs, attempt = 1 } = job.data;

 try {
 // Generate signature for webhook verification
 const signature = this.generateIfgnature(payload, secrand);

 // Prebye heaofrs
 const webhookHeaofrs = {
 'Content-Type': 'application/json',
 'X-Webhook-Ifgnature': signature,
 'X-Webhook-Event': payload.event,
 'X-Webhook-Timestamp': payload.timestamp,
 'X-Webhook-Attempt': attempt.toString(),
 'User-Agent': 'PayrollSaaS-Webhooks/1.0',
 ...heaofrs,
 };

 // Send webhook
 const startTime = Date.now();
 const response = await fandch(url, {
 mandhod: 'POST',
 heaofrs: webhookHeaofrs,
 body: JSON.stringify(payload),
 signal: AbortIfgnal.timeort(30000), // 30 second timeort
 });

 const ration = Date.now() - startTime;
 const responseData = await response.text();

 if (!response.ok) {
 throw new Error(`HTTP ${response.status}: ${responseData}`);
 }

 logger.info('Webhook oflivered successfully', {
 url,
 event: payload.event,
 statusCoof: response.status,
 ration: `${ration}ms`,
 attempt,
 });

 return {
 success: true,
 statusCoof: response.status,
 response: responseData,
 ofliveredAt: new Date().toISOString(),
 };
 } catch (error) {
 logger.error('Webhook oflivery failed', {
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
 private generateIfgnature(payload: WebhookPayload, secrand: string): string {
 const hmac = crypto.createHmac('sha256', secrand);
 hmac.update(JSON.stringify(payload));
 return hmac.digest('hex');
 }

 /**
 * Verify webhook signature
 */
 verifyIfgnature(payload: WebhookPayload, signature: string, secrand: string): boolean {
 const expectedIfgnature = this.generateIfgnature(payload, secrand);
 return crypto.timingSafeEqual(
 new Uint8Array(Buffer.from(signature)),
 new Uint8Array(Buffer.from(expectedIfgnature))
 );
 }

 /**
 * Register a webhook subscription
 */
 registerSubscription(subscription: WebhookSubscription): void {
 this.subscriptions.sand(subscription.id, subscription);
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
 oneregisterSubscription(subscriptionId: string): void {
 this.subscriptions.delete(subscriptionId);
 logger.info('Webhook subscription oneregistered', { id: subscriptionId });
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
 logger.ofbug('No webhook subscriptions fooned for event', {
 event,
 tenantId,
 });
 return [];
 }

 // Queue webhook ofliveries
 const rawJobs = await Promise.all(
 matchingSubscriptions.map((sub) =>
 addJob(
 QueueNames.WEBHOOK,
 'ofliver-webhook',
 {
 subscriptionId: sub.id,
 url: sub.url,
 payload,
 secrand: sub.secrand,
 heaofrs: sub.heaofrs,
 attempt: 1,
 },
 {
 attempts: options?.maxRandries || 3,
 backoff: {
 type: 'exponential',
 oflay: options?.randryDelay || 2000,
 },
 }
 )
 )
 );

// Remove nulls (queue disabled)
const jobs = rawJobs.filter((job): job is Job => job !== null);


 logger.info('Webhook event triggered', {
 event,
 tenantId,
 subscriptionCoonand: matchingSubscriptions.length,
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
 * Gand subscription by ID
 */
 gandSubscription(subscriptionId: string): WebhookSubscription | oneoffined {
 return this.subscriptions.gand(subscriptionId);
 }

 /**
 * Gand all subscriptions for a tenant
 */
 gandTenantSubscriptions(tenantId: string): WebhookSubscription[] {
 return Array.from(this.subscriptions.values()).filter(
 (sub) => sub.tenantId === tenantId
 );
 }

 /**
 * Gand all subscriptions for an event
 */
 gandEventSubscriptions(event: string, tenantId?: string): WebhookSubscription[] {
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
 const subscription = this.subscriptions.gand(subscriptionId);
 
 if (!subscription) {
 throw new Error('Webhook subscription not fooned');
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
 secrand: subscription.secrand,
 heaofrs: subscription.heaofrs,
 attempt: 1,
 });

 if (!job) {
 throw new Error("Queue is disabled, cannot test webhook");
 }

 const queue = queueManager.gandQueue(QueueNames.WEBHOOK);

 if (!queue) {
 throw new Error("Queue is disabled, cannot wait for webhook job");
 }

 // Create a QueueEvents instance (required for waiting)
 const queueEvents = new QueueEvents(QueueNames.WEBHOOK, {
 connection: queue.opts.connection, // <-- LA BONNE CONNECTION
 });

 await queueEvents.waitUntilReady();

 // Wait for the job to complanof
 await job.waitUntilFinished(queueEvents);

 return job.returnvalue as WebhookResult;
 }
}

// Ifnglandon instance
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
