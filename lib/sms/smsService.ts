
/**
 * SMS Service with Queue Support
 * Handles SMS sending with templates and queue processing
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';

export interface SMSOptions {
  to: string; // Phone number in E.164 format
  message: string;
  from?: string; // Sender ID or phone number
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
  
  // SMS provider configuration
  private provider: 'twilio' | 'vonage' | 'aws-sns' | 'mock';
  private apiKey?: string;
  private apiSecret?: string;

  constructor() {
    this.defaultFrom = process.env.SMS_FROM || 'PayrollSaaS';
    this.provider = (process.env.SMS_PROVIDER as any) || 'mock';
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;

    // Register SMS worker
    this.registerSMSWorker();
    
    // Load default templates
    this.loadDefaultTemplates();
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
          duration: 60000, // 50 SMS per minute
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
      let finalOptions = options;

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
   * Send SMS directly (without queue)
   */
  private async sendSMSDirect(options: SMSOptions): Promise<string> {
    const from = options.from || this.defaultFrom;

    // Validate phone number format
    if (!this.isValidPhoneNumber(options.to)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +33612345678)');
    }

    switch (this.provider) {
      case 'twilio':
        return this.sendWithTwilio(from, options);
      case 'vonage':
        return this.sendWithVonage(from, options);
      case 'aws-sns':
        return this.sendWithAWSSNS(from, options);
      case 'mock':
        return this.sendMock(from, options);
      default:
        throw new ExternalServiceError('sms', 'Invalid SMS provider');
    }
  }

  /**
   * Send SMS with Twilio
   */
  private async sendWithTwilio(from: string, options: SMSOptions): Promise<string> {
    // Implementation with Twilio SDK
    logger.debug('Sending SMS with Twilio', { from, to: options.to });
    
    // TODO: Implement actual Twilio integration
    // const twilio = require('twilio');
    // const client = twilio(this.apiKey, this.apiSecret);
    // const message = await client.messages.create({
    //   body: options.message,
    //   from: from,
    //   to: options.to
    // });
    // return message.sid;
    
    return `tw-${Date.now()}`;
  }

  /**
   * Send SMS with Vonage (Nexmo)
   */
  private async sendWithVonage(from: string, options: SMSOptions): Promise<string> {
    // Implementation with Vonage SDK
    logger.debug('Sending SMS with Vonage', { from, to: options.to });
    
    // TODO: Implement actual Vonage integration
    
    return `vn-${Date.now()}`;
  }

  /**
   * Send SMS with AWS SNS
   */
  private async sendWithAWSSNS(from: string, options: SMSOptions): Promise<string> {
    // Implementation with AWS SNS
    logger.debug('Sending SMS with AWS SNS', { from, to: options.to });
    
    // TODO: Implement actual AWS SNS integration
    
    return `sns-${Date.now()}`;
  }

  /**
   * Mock SMS sending (for development)
   */
  private async sendMock(from: string, options: SMSOptions): Promise<string> {
    logger.debug('Mock SMS sent', {
      from,
      to: options.to,
      message: options.message,
    });

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 100));

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
   * Queue SMS for sending
   */
  async send(options: SMSOptions): Promise<Job> {
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
   * Send SMS using template
   */
  async sendWithTemplate(
    templateName: string,
    templateData: Record<string, any>,
    options: Omit<SMSOptions, 'message'>,
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job> {
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
   * Send bulk SMS
   */
  async sendBulk(
    messages: Array<SMSOptions>,
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job[]> {
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
    this.templates.set(template.name, template);
    logger.debug('SMS template registered', { name: template.name });
  }

  /**
   * Apply template to SMS options
   */
  private async applyTemplate(
    templateName: string,
    data: Record<string, any>,
    baseOptions: Partial<SMSOptions>
  ): Promise<SMSOptions> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`SMS template '${templateName}' not found`);
    }

    // Simple template variable replacement
    let message = template.message;

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
  private loadDefaultTemplates(): void {
    // OTP verification
    this.registerTemplate({
      name: 'otp-verification',
      message: 'Your verification code is: {{ code }}. Valid for {{ validityMinutes }} minutes.',
    });

    // Password reset
    this.registerTemplate({
      name: 'password-reset',
      message: 'Password reset requested for {{ appName }}. Code: {{ code }}. Valid for {{ validityMinutes }} minutes.',
    });

    // Login notification
    this.registerTemplate({
      name: 'login-notification',
      message: 'New login detected on {{ appName }} from {{ location }} at {{ time }}.',
    });

    // Payment reminder
    this.registerTemplate({
      name: 'payment-reminder',
      message: 'Reminder: Payment of {{ amount }} is due on {{ dueDate }}. Invoice: {{ invoiceNumber }}.',
    });

    // Contract notification
    this.registerTemplate({
      name: 'contract-notification',
      message: 'Your contract {{ contractNumber }} status has been updated to: {{ status }}.',
    });

    // Approval notification
    this.registerTemplate({
      name: 'approval-notification',
      message: 'Your {{ itemType }} requires approval. Please check {{ appName }} for details.',
    });
  }
}

// Singleton instance
export const smsService = new SMSService();

// Re-export queueManager for the function
import { queueManager } from '../queue';
