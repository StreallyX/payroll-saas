
/**
 * Email Service with Queue Support
 * Handles email sending with templates and queue processing
 */

import { Job } from 'bullmq';
import { addJob, QueueNames, registerWorker } from '../queue';
import { logger } from '../logging';
import { ExternalServiceError } from '../errors';

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
  private provider: 'sendgrid' | 'mailgun' | 'smtp' | 'mock';
  private apiKey?: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@payroll-saas.com';
    this.provider = (process.env.EMAIL_PROVIDER as any) || 'mock';
    this.apiKey = process.env.EMAIL_API_KEY;

    // Register email worker
    this.registerEmailWorker();
    
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
   * Send email with SendGrid
   */
  private async sendWithSendGrid(from: string, options: EmailOptions): Promise<string> {
    // Implementation with SendGrid SDK
    // This is a placeholder - implement with actual SendGrid integration
    logger.debug('Sending email with SendGrid', { from, to: options.to });
    
    // TODO: Implement actual SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.apiKey);
    // const response = await sgMail.send({ from, ...options });
    
    return `sg-${Date.now()}`;
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
   * Queue email for sending
   */
  async send(options: EmailOptions, priority?: 'high' | 'normal' | 'low'): Promise<Job> {
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
   * Send email using template
   */
  async sendWithTemplate(
    templateName: string,
    templateData: Record<string, any>,
    options: Omit<EmailOptions, 'html' | 'text' | 'subject'> & { subject?: string },
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job> {
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
   * Send bulk emails
   */
  async sendBulk(
    emails: Array<EmailOptions>,
    priority?: 'high' | 'normal' | 'low'
  ): Promise<Job[]> {
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

// Re-export queueManager for the function
import { queueManager } from '../queue';
