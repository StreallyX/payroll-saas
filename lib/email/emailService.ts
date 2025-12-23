
/**
 * Email Service with Queue Support
 * Handles email sending with templates and queue processing
 * Supports Resend, SendGrid, Mailgun, SMTP, and Mock mode
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker, queueManager } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';
import { serviceConfig } from '../config/serviceConfig';

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailJobData {
  type: 'single' | 'bulk' | 'template';
  options: EmailOptions;
  templateName?: string;
  templateData?: Record<string, any>;
  tenantId?: string;
  userId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private defaultFrom: string;
  private templates: Map<string, EmailTemplate> = new Map();
  
  // Email provider configuration
  private provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp' | 'mock';
  private apiKey?: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@payroll-saas.com';
    
    // Get provider from service config
    const configuredProvider = serviceConfig.getServiceProvider('email');
    this.provider = (configuredProvider || 'mock') as any;
    
    // Get API key based on provider
    if (this.provider === 'resend') {
      this.apiKey = process.env.RESEND_API_KEY;
    } else if (this.provider === 'sendgrid') {
      this.apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
    } else if (this.provider === 'mailgun') {
      this.apiKey = process.env.MAILGUN_API_KEY || process.env.EMAIL_API_KEY;
    } else {
      this.apiKey = process.env.EMAIL_API_KEY;
    }

    // Register email worker only if queue is available
    if (queueManager.isAvailable()) {
      this.registerEmailWorker();
    } else {
      logger.warn('Email queue not available - emails will be sent immediately (synchronously)');
    }
    
    // Load default templates
    this.loadDefaultTemplates();
  }

  /**
   * Register email processing worker
   */
  private registerEmailWorker() {
    registerWorker<EmailJobData, EmailResult>(
      QueueNames.EMAIL,
      async (job: Job<EmailJobData>) => {
        return this.processEmailJob(job);
      },
      {
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 60000, // 100 emails per minute
        },
      }
    );
  }

  /**
   * Process email job
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<EmailResult> {
    const { type, options, templateName, templateData, tenantId, userId } = job.data;

    try {
      let finalOptions = options;

      // Apply template if specified
      if (type === 'template' && templateName && templateData) {
        finalOptions = await this.applyTemplate(templateName, templateData, options);
      }

      // Send email
      const messageId = await this.sendEmailDirect(finalOptions);

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId,
        tenantId,
        userId,
      });

      return { success: true, messageId };
    } catch (error) {
      logger.error('Email sending failed', {
        error,
        to: options.to,
        subject: options.subject,
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
   * Send email directly (without queue)
   */
  private async sendEmailDirect(options: EmailOptions): Promise<string> {
    const from = options.from || this.defaultFrom;

    switch (this.provider) {
      case 'resend':
        return this.sendWithResend(from, options);
      case 'sendgrid':
        return this.sendWithSendGrid(from, options);
      case 'mailgun':
        return this.sendWithMailgun(from, options);
      case 'smtp':
        return this.sendWithSMTP(from, options);
      case 'mock':
        return this.sendMock(from, options);
      default:
        throw new ExternalServiceError('email', 'Invalid email provider');
    }
  }

  /**
   * Send email with Resend
   */
  private async sendWithResend(from: string, options: EmailOptions): Promise<string> {
    if (!this.apiKey) {
      throw new ExternalServiceError('email', 'Resend API key not configured');
    }

    try {
      // Dynamic import to avoid requiring resend if not used
      const { Resend } = await import('resend');
      const resend = new Resend(this.apiKey);

      logger.debug('Sending email with Resend', { from, to: options.to });

      const payload: any = {
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
        })),
        headers: options.headers,
      };

      const result = await resend.emails.send(payload as any);

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      return result.data?.id || `resend-${Date.now()}`;
    } catch (error) {
      logger.error('Failed to send email with Resend', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw new ExternalServiceError('email', `Resend sending failed: ${error}`);
    }
  }

  /**
   * Send email with SendGrid
   */
  /**
   * Send email with SendGrid
   */
  private async sendWithSendGrid(from: string, options: EmailOptions): Promise<string> {
    if (!this.apiKey) {
      throw new ExternalServiceError('email', 'SendGrid API key not configured');
    }

    try {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);

      logger.debug('Sending email with SendGrid', { from, to: options.to });

      // 🔥 NORMALISATION DES ATTACHMENTS POUR SENDGRID
      const attachments = options.attachments
        ? options.attachments.map(att => {
            let contentString = '';

            if (att.content instanceof Buffer) {
              contentString = att.content.toString('base64');
            } else if (typeof att.content === 'string') {
              contentString = Buffer.from(att.content).toString('base64');
            } else if (att.path) {
              const fs = require('fs');
              const fileBuffer = fs.readFileSync(att.path);
              contentString = fileBuffer.toString('base64');
            }

            return {
              filename: att.filename,
              content: contentString,
              type: att.contentType,
              disposition: 'attachment',
            };
          })
        : undefined;

      const response = await sgMail.default.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html ?? "",
        text: options.text ?? "",
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments,
        headers: options.headers,
      });

      return (
        response[0]?.headers?.['x-message-id'] ||
        `sg-${Date.now()}`
      );
    } catch (error) {
      logger.error('Failed to send email with SendGrid', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw new ExternalServiceError('email', `SendGrid sending failed: ${error}`);
    }
  }


  /**
   * Send email with Mailgun
   */
  private async sendWithMailgun(from: string, options: EmailOptions): Promise<string> {
    // Implementation with Mailgun SDK
    logger.debug('Sending email with Mailgun', { from, to: options.to });
    
    // TODO: Implement actual Mailgun integration
    
    return `mg-${Date.now()}`;
  }

  /**
   * Send email with SMTP
   */
  private async sendWithSMTP(from: string, options: EmailOptions): Promise<string> {
    // Implementation with Nodemailer
    logger.debug('Sending email with SMTP', { from, to: options.to });
    
    // TODO: Implement actual SMTP integration
    
    return `smtp-${Date.now()}`;
  }

  /**
   * Mock email sending (for development)
   */
  private async sendMock(from: string, options: EmailOptions): Promise<string> {
    logger.debug('Mock email sent', {
      from,
      to: options.to,
      subject: options.subject,
    });

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `mock-${Date.now()}`;
  }

  /**
   * Queue email for sending (or send immediately if queue is not available)
   */
  async send(options: EmailOptions, priority?: 'high' | 'normal' | 'low'): Promise<Job | null> {
    // If queue is not available, send immediately
    if (!queueManager.isAvailable()) {
      logger.debug('Queue not available, sending email immediately', {
        to: options.to,
        subject: options.subject,
      });
      
      try {
        await this.sendEmailDirect(options);
        return null;
      } catch (error) {
        logger.error('Failed to send email immediately', { error, options });
        throw error;
      }
    }

    // Queue the email
    return addJob(
      QueueNames.EMAIL,
      'send-email',
      {
        type: 'single',
        options,
      },
      {
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      }
    );
  }

  /**
   * Send email using template (or send immediately if queue is not available)
   */
  async sendWithTemplate(
    templateName: string,
    templateData: Record<string, any>,
    options: Omit<EmailOptions, 'html' | 'text' | 'subject'> & { subject?: string },
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job | null> {
    // If queue is not available, send immediately
    if (!queueManager.isAvailable()) {
      logger.debug('Queue not available, sending template email immediately', {
        to: options.to,
        template: templateName,
      });
      
      try {
        const finalOptions = await this.applyTemplate(templateName, templateData, options);
        await this.sendEmailDirect(finalOptions);
        return null;
      } catch (error) {
        logger.error('Failed to send template email immediately', { error, templateName });
        throw error;
      }
    }

    // Queue the email
    return addJob(
      QueueNames.EMAIL,
      'send-template-email',
      {
        type: 'template',
        options: options as EmailOptions,
        templateName,
        templateData,
      },
      {
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      }
    );
  }

  /**
   * Send bulk emails (or send immediately if queue is not available)
   */
  async sendBulk(
    emails: Array<EmailOptions>,
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job[] | null> {
    // If queue is not available, send immediately
    if (!queueManager.isAvailable()) {
      logger.debug('Queue not available, sending bulk emails immediately', {
        count: emails.length,
      });
      
      const results = await Promise.allSettled(
        emails.map(options => this.sendEmailDirect(options))
      );
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.warn(`${failures.length} of ${emails.length} emails failed to send`, { failures });
      }
      
      return null;
    }

    // Queue the emails
    const jobs = emails.map((options) => ({
      name: 'send-email',
      data: {
        type: 'single' as const,
        options,
      },
      opts: {
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      },
    }));

    return (await queueManager.addBulk(QueueNames.EMAIL, jobs)) as any;
  }

  /**
   * Register an email template
   */
  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template);
    logger.debug('Email template registered', { name: template.name });
  }

  /**
   * Apply template to email options
   */
  private async applyTemplate(
    templateName: string,
    data: Record<string, any>,
    baseOptions: Partial<EmailOptions>
  ): Promise<EmailOptions> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Simple template variable replacement
    let html = template.html;
    let text = template.text || '';
    let subject = template.subject;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, String(value));
      text = text.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    return {
      ...baseOptions,
      subject: baseOptions.subject || subject,
      html,
      text,
    } as EmailOptions;
  }

  /**
   * Load default email templates
   */
  private loadDefaultTemplates(): void {
    // Welcome email
    this.registerTemplate({
      name: 'welcome',
      subject: 'Welcome to {{ companyName }}!',
      html: `
        <h1>Welcome {{ userName }}!</h1>
        <p>Thank you for joining {{ companyName }}.</p>
        <p>Your account has been created successfully.</p>
        <p><a href="{{ loginUrl }}">Click here to login</a></p>
      `,
      text: 'Welcome {{ userName }}! Thank you for joining {{ companyName }}.',
    });

    // Password reset
    this.registerTemplate({
      name: 'password-reset',
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello {{ userName }},</p>
        <p>We received a request to reset your password.</p>
        <p><a href="{{ resetUrl }}">Click here to reset your password</a></p>
        <p>This link will expire in {{ expiryHours }} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: 'Password reset requested. Visit: {{ resetUrl }}',
    });

    // Account created
    this.registerTemplate({
      name: 'account-created',
      subject: 'Your Account Has Been Created - {{ companyName }}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .credentials { background-color: #ffffff; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background-color: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{ companyName }}!</h1>
            </div>
            <div class="content">
              <p>Hello {{ userName }},</p>
              <p>Your account has been successfully created. We're excited to have you on board!</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Login Credentials</h3>
                <p><strong>Email:</strong> {{ userEmail }}</p>
                <p><strong>Password:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px;">{{ password }}</code></p>
              </div>

              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong><br>
                You will be required to change your password upon first login for security purposes.
              </div>

              <div style="text-align: center;">
                <a href="{{ loginUrl }}" class="button">Login to Your Account</a>
              </div>

              <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>This email was sent by {{ companyName }}.<br>
              Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to {{ companyName }}!

Hello {{ userName }},

Your account has been successfully created.

Your Login Credentials:
Email: {{ userEmail }}
Password: {{ password }}

IMPORTANT: You will be required to change your password upon first login for security purposes.

Login URL: {{ loginUrl }}

If you have any questions, please contact our support team.

This email was sent by {{ companyName }}.`,
    });

    // Contractor invitation
    this.registerTemplate({
      name: 'contractor-invitation',
      subject: 'You have been invited to join {{ companyName }}',
      html: `
        <h1>Welcome to {{ companyName }}!</h1>
        <p>Hello {{ contractorName }},</p>
        <p>You have been invited to join {{ companyName }} as a contractor.</p>
        <p><a href="{{ invitationUrl }}">Click here to accept the invitation</a></p>
      `,
      text: 'You have been invited to join {{ companyName }}. Visit: {{ invitationUrl }}',
    });

    // Invoice notification
    this.registerTemplate({
      name: 'invoice-notification',
      subject: 'New Invoice {{ invoiceNumber }}',
      html: `
        <h1>New Invoice</h1>
        <p>Hello {{ clientName }},</p>
        <p>A new invoice has been generated:</p>
        <ul>
          <li>Invoice Number: {{ invoiceNumber }}</li>
          <li>Amount: {{ amount }}</li>
          <li>Due Date: {{ dueDate }}</li>
        </ul>
        <p><a href="{{ invoiceUrl }}">View Invoice</a></p>
      `,
      text: 'New invoice {{ invoiceNumber }} for {{ amount }}. View: {{ invoiceUrl }}',
    });

    // Payslip notification
    this.registerTemplate({
      name: 'payslip-notification',
      subject: 'Your Payslip for {{ period }}',
      html: `
        <h1>Payslip for {{ period }}</h1>
        <p>Hello {{ employeeName }},</p>
        <p>Your payslip for {{ period }} is now available.</p>
        <p>Net Pay: {{ netPay }}</p>
        <p><a href="{{ payslipUrl }}">View Payslip</a></p>
      `,
      text: 'Your payslip for {{ period }} is available. View: {{ payslipUrl }}',
    });
  }
}

// Singleton instance
export const emailService = new EmailService();
