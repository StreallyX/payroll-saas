
/**
 * SMS Service with Queue Support
 * Handles SMS sending with templates and queue processing
 * Supports Twilio, Vonage, AWS SNS, and Mock mode
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker, queueManager } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';
import { serviceConfig } from '../config/serviceConfig';

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
  private twilioAccountSid?: string;
  private twilioAuthToken?: string;
  private twilioPhoneNumber?: string;
  
  // Legacy support
  private apiKey?: string;
  private apiSecret?: string;

  constructor() {
    // Get provider from service config
    const configuredProvider = serviceConfig.getServiceProvider('sms');
    this.provider = (configuredProvider || 'mock') as any;
    
    // Get Twilio credentials (new format)
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Legacy credentials (fallback)
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
    
    // Set default from number
    this.defaultFrom = this.twilioPhoneNumber || process.env.SMS_FROM || 'PayrollSaaS';

    // Register SMS worker only if queue is available
    if (queueManager.isAvailable()) {
      this.registerSMSWorker();
    } else {
      logger.warn('SMS queue not available - SMS will be sent immediately (synchronously)');
    }
    
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
    // Check credentials (new format)
    const accountSid = this.twilioAccountSid || this.apiKey;
    const authToken = this.twilioAuthToken || this.apiSecret;

    if (!accountSid || !authToken) {
      throw new ExternalServiceError(
        'sms',
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
      );
    }

    try {
      // Dynamic import to avoid requiring twilio if not used
      const twilio = await import('twilio');
      const client = twilio.default(accountSid, authToken);

      logger.debug('Sending SMS with Twilio', { from, to: options.to });

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
   * Queue SMS for sending (or send immediately if queue is not available)
   */
  async send(options: SMSOptions): Promise<Job | null> {
    // If queue is not available, send immediately
    if (!queueManager.isAvailable()) {
      logger.debug('Queue not available, sending SMS immediately', {
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
      logger.debug('Queue not available, sending template SMS immediately', {
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
      logger.debug('Queue not available, sending bulk SMS immediately', {
        count: messages.length,
      });
      
      const results = await Promise.allSettled(
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
