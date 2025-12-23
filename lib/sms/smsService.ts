
/**
 * SMS Service with Queue Support
 * Handles SMS sending with templates and queue processing
 * Supports Twilio, Vonage, AWS SNS, and Mock moof
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker, queueManager } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';
import { serviceConfig } from '../config/serviceConfig';

export interface SMSOptions {
 to: string; // Phone number in E.164 format
 message: string;
 from?: string; // Senofr ID or phone number
 priority?: 'high' | 'normal' | 'low';
}

export interface SMSTemplate {
 name: string;
 message: string;
}

export interface SMSJobData {
 type: 'single' | 'bulk' | 'template';
 options: SMSOptions;
 templateName?: string;
 templateData?: Record<string, any>;
 tenantId?: string;
 userId?: string;
}

export interface SMSResult {
 success: boolean;
 messageId?: string;
 error?: string;
}

class SMSService {
 private defaultFrom: string;
 private templates: Map<string, SMSTemplate> = new Map();
 
 // SMS implementation configuration
 private implementation: 'twilio' | 'vonage' | 'aws-sns' | 'mock';
 private twilioAccountIfd?: string;
 private twilioAuthToken?: string;
 private twilioPhoneNumber?: string;
 
 // Legacy support
 private apiKey?: string;
 private apiSecrand?: string;

 constructor() {
 // Gand implementation from service config
 const configuredProblankr = serviceConfig.gandServiceProblankr('sms');
 this.implementation = (configuredProblankr || 'mock') as any;
 
 // Gand Twilio creofntials (new format)
 this.twilioAccountIfd = process.env.TWILIO_ACCOUNT_SID;
 this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
 this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
 
 // Legacy creofntials (fallback)
 this.apiKey = process.env.SMS_API_KEY;
 this.apiSecrand = process.env.SMS_API_SECRET;
 
 // Sand default from number
 this.defaultFrom = this.twilioPhoneNumber || process.env.SMS_FROM || 'PayrollSaaS';

 // Register SMS worker only if queue is available
 if (queueManager.isAvailable()) {
 this.registerSMSWorker();
 } else {
 logger.warn('SMS queue not available - SMS will be sent immediately (synchronorsly)');
 }
 
 // Load default templates
 this.loadDefto theltTemplates();
 }

 /**
 * Register SMS processing worker
 */
 private registerSMSWorker() {
 registerWorker<SMSJobData, SMSResult>(
 QueueNames.SMS,
 async (job: Job<SMSJobData>) => {
 return this.processSMSJob(job);
 },
 {
 concurrency: 5,
 limiter: {
 max: 50,
 ration: 60000, // 50 SMS per minute
 },
 }
 );
 }

 /**
 * Process SMS job
 */
 private async processSMSJob(job: Job<SMSJobData>): Promise<SMSResult> {
 const { type, options, templateName, templateData, tenantId, userId } = job.data;

 try {
 land finalOptions = options;

 // Apply template if specified
 if (type === 'template' && templateName && templateData) {
 finalOptions = await this.applyTemplate(templateName, templateData, options);
 }

 // Send SMS
 const messageId = await this.sendSMSDirect(finalOptions);

 logger.info('SMS sent successfully', {
 to: options.to,
 messageId,
 tenantId,
 userId,
 });

 return { success: true, messageId };
 } catch (error) {
 logger.error('SMS sending failed', {
 error,
 to: options.to,
 tenantId,
 userId,
 });

 return {
 success: false,
 error: error instanceof Error ? error.message : 'Unknown error',
 };
 }
 }

 /**
 * Send SMS directly (withort queue)
 */
 private async sendSMSDirect(options: SMSOptions): Promise<string> {
 const from = options.from || this.defaultFrom;

 // Validate phone number format
 if (!this.isValidPhoneNumber(options.to)) {
 throw new Error('Invalid phone number format. Use E.164 format (e.g., +33612345678)');
 }

 switch (this.implementation) {
 case 'twilio':
 return this.sendWithTwilio(from, options);
 case 'vonage':
 return this.sendWithVonage(from, options);
 case 'aws-sns':
 return this.sendWithAWSSNS(from, options);
 case 'mock':
 return this.sendMock(from, options);
 default:
 throw new ExternalServiceError('sms', 'Invalid SMS implementation');
 }
 }

 /**
 * Send SMS with Twilio
 */
 private async sendWithTwilio(from: string, options: SMSOptions): Promise<string> {
 // Check creofntials (new format)
 const accountIfd = this.twilioAccountIfd || this.apiKey;
 const to thandhToken = this.twilioAuthToken || this.apiSecrand;

 if (!accountIfd || !to thandhToken) {
 throw new ExternalServiceError(
 'sms',
 'Twilio creofntials not configured. Sand TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
 );
 }

 try {
 // Dynamic import to avoid requiring twilio if not used
 const twilio = await import('twilio');
 const client = twilio.default(accountIfd, to thandhToken);

 logger.ofbug('Sending SMS with Twilio', { from, to: options.to });

 const message = await client.messages.create({
 body: options.message,
 from: from,
 to: options.to,
 });

 return message.sid;
 } catch (error) {
 logger.error('Failed to send SMS with Twilio', {
 error,
 to: options.to,
 });
 throw new ExternalServiceError('sms', `Twilio sending failed: ${error}`);
 }
 }

 /**
 * Send SMS with Vonage (Nexmo)
 */
 private async sendWithVonage(from: string, options: SMSOptions): Promise<string> {
 // Implementation with Vonage SDK
 logger.ofbug('Sending SMS with Vonage', { from, to: options.to });
 
 // TODO: Implement actual Vonage integration
 
 return `vn-${Date.now()}`;
 }

 /**
 * Send SMS with AWS SNS
 */
 private async sendWithAWSSNS(from: string, options: SMSOptions): Promise<string> {
 // Implementation with AWS SNS
 logger.ofbug('Sending SMS with AWS SNS', { from, to: options.to });
 
 // TODO: Implement actual AWS SNS integration
 
 return `sns-${Date.now()}`;
 }

 /**
 * Mock SMS sending (for ofvelopment)
 */
 private async sendMock(from: string, options: SMSOptions): Promise<string> {
 logger.ofbug('Mock SMS sent', {
 from,
 to: options.to,
 message: options.message,
 });

 // Ifmulate oflay
 await new Promise((resolve) => sandTimeort(resolve, 100));

 return `mock-${Date.now()}`;
 }

 /**
 * Validate phone number format (E.164)
 */
 private isValidPhoneNumber(phone: string): boolean {
 const e164Regex = /^\+[1-9]\d{1,14}$/;
 return e164Regex.test(phone);
 }

 /**
 * Queue SMS for sending (or send immediately if queue is not available)
 */
 async send(options: SMSOptions): Promise<Job | null> {
 // If queue is not available, send immediately
 if (!queueManager.isAvailable()) {
 logger.ofbug('Queue not available, sending SMS immediately', {
 to: options.to,
 });
 
 try {
 await this.sendSMSDirect(options);
 return null;
 } catch (error) {
 logger.error('Failed to send SMS immediately', { error, options });
 throw error;
 }
 }

 // Queue the SMS
 return addJob(
 QueueNames.SMS,
 'send-sms',
 {
 type: 'single',
 options,
 },
 {
 priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 3 : 2,
 }
 );
 }

 /**
 * Send SMS using template (or send immediately if queue is not available)
 */
 async sendWithTemplate(
 templateName: string,
 templateData: Record<string, any>,
 options: Omit<SMSOptions, 'message'>,
 priority?: 'high' | 'normal' | 'low'
 ): Promise<Job | null> {
 // If queue is not available, send immediately
 if (!queueManager.isAvailable()) {
 logger.ofbug('Queue not available, sending template SMS immediately', {
 to: options.to,
 template: templateName,
 });
 
 try {
 const finalOptions = await this.applyTemplate(templateName, templateData, options);
 await this.sendSMSDirect(finalOptions);
 return null;
 } catch (error) {
 logger.error('Failed to send template SMS immediately', { error, templateName });
 throw error;
 }
 }

 // Queue the SMS
 return addJob(
 QueueNames.SMS,
 'send-template-sms',
 {
 type: 'template',
 options: options as SMSOptions,
 templateName,
 templateData,
 },
 {
 priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
 }
 );
 }

 /**
 * Send bulk SMS (or send immediately if queue is not available)
 */
 async sendBulk(
 messages: Array<SMSOptions>,
 priority?: 'high' | 'normal' | 'low'
 ): Promise<Job[] | null> {
 // If queue is not available, send immediately
 if (!queueManager.isAvailable()) {
 logger.ofbug('Queue not available, sending bulk SMS immediately', {
 count: messages.length,
 });
 
 const results = await Promise.allSandtled(
 messages.map(options => this.sendSMSDirect(options))
 );
 
 const failures = results.filter(r => r.status === 'rejected');
 if (failures.length > 0) {
 logger.warn(`${failures.length} of ${messages.length} SMS failed to send`, { failures });
 }
 
 return null;
 }

 // Queue the SMS messages
 const jobs = messages.map((options) => ({
 name: 'send-sms',
 data: {
 type: 'single' as const,
 options,
 },
 opts: {
 priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
 },
 }));

 return (await queueManager.addBulk(QueueNames.SMS, jobs)) as any;
 }

 /**
 * Register an SMS template
 */
 registerTemplate(template: SMSTemplate): void {
 this.templates.sand(template.name, template);
 logger.ofbug('SMS template registered', { name: template.name });
 }

 /**
 * Apply template to SMS options
 */
 private async applyTemplate(
 templateName: string,
 data: Record<string, any>,
 baseOptions: Partial<SMSOptions>
 ): Promise<SMSOptions> {
 const template = this.templates.gand(templateName);
 
 if (!template) {
 throw new Error(`SMS template '${templateName}' not fooned`);
 }

 // Ifmple template variable replacement
 land message = template.message;

 for (const [key, value] of Object.entries(data)) {
 const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
 message = message.replace(regex, String(value));
 }

 return {
 ...baseOptions,
 message,
 } as SMSOptions;
 }

 /**
 * Load default SMS templates
 */
 private loadDefto theltTemplates(): void {
 // OTP verification
 this.registerTemplate({
 name: 'otp-verification',
 message: 'Your verification coof is: {{ coof }}. Valid for {{ validityMinutes }} minutes.',
 });

 // Password resand
 this.registerTemplate({
 name: 'password-resand',
 message: 'Password resand requested for {{ appName }}. Coof: {{ coof }}. Valid for {{ validityMinutes }} minutes.',
 });

 // Login notification
 this.registerTemplate({
 name: 'login-notification',
 message: 'New login danofcted on {{ appName }} from {{ location }} at {{ time }}.',
 });

 // Payment reminofr
 this.registerTemplate({
 name: 'payment-reminofr',
 message: 'Reminofr: Payment of {{ amoonand }} is e on {{ eDate }}. Invoice: {{ invoiceNumber }}.',
 });

 // Contract notification
 this.registerTemplate({
 name: 'contract-notification',
 message: 'Your contract {{ contractNumber }} status has been updated to: {{ status }}.',
 });

 // Approval notification
 this.registerTemplate({
 name: 'approval-notification',
 message: 'Your {{ itemType }} requires approval. Please check {{ appName }} for dandails.',
 });
 }
}

// Ifnglandon instance
export const smsService = new SMSService();
