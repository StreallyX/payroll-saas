
/**
 * Service Configuration Manager
 * Centralizes external service configuration and availability checks
 * with graceful degradation support
 */

import { logger } from '../logging';

export interface ServiceStatus {
  enabled: boolean;
  provider: string | null;
  mode: 'production' | 'mock' | 'disabled';
  reason?: string;
}

class ServiceConfigManager {
  private serviceStatuses: Map<string, ServiceStatus> = new Map();

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize all external services
   */
  private initializeServices(): void {
    this.checkRedisConfig();
    this.checkEmailConfig();
    this.checkSMSConfig();
  }

  /**
   * Check Redis/Upstash configuration
   */
  private checkRedisConfig(): void {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT;

    let status: ServiceStatus;

    if (upstashUrl && upstashToken) {
      status = {
        enabled: true,
        provider: 'upstash',
        mode: 'production',
      };
      logger.info('✅ Redis Queue Service: Upstash Redis REST API configured');
    } else if (redisHost || redisPort) {
      status = {
        enabled: true,
        provider: 'redis',
        mode: 'production',
      };
      logger.info('✅ Redis Queue Service: Local Redis configured');
    } else {
      status = {
        enabled: false,
        provider: null,
        mode: 'disabled',
        reason: 'No Redis or Upstash configuration found',
      };
      logger.warn(
        '⚠️  Redis Queue Service: DISABLED - Background jobs will not be processed. ' +
        'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for Upstash, ' +
        'or REDIS_HOST and REDIS_PORT for local Redis.'
      );
    }

    this.serviceStatuses.set('redis', status);
  }

  /**
   * Check Email service configuration
   */
  private checkEmailConfig(): void {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || 'mock';
    const resendKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const mailgunKey = process.env.MAILGUN_API_KEY;
    const emailApiKey = process.env.EMAIL_API_KEY;

    let status: ServiceStatus;

    if (provider === 'resend' && resendKey) {
      status = {
        enabled: true,
        provider: 'resend',
        mode: 'production',
      };
      logger.info('✅ Email Service: Resend configured');
    } else if (provider === 'sendgrid' && (sendgridKey || emailApiKey)) {
      status = {
        enabled: true,
        provider: 'sendgrid',
        mode: 'production',
      };
      logger.info('✅ Email Service: SendGrid configured');
    } else if (provider === 'mailgun' && (mailgunKey || emailApiKey)) {
      status = {
        enabled: true,
        provider: 'mailgun',
        mode: 'production',
      };
      logger.info('✅ Email Service: Mailgun configured');
    } else if (provider === 'smtp') {
      status = {
        enabled: true,
        provider: 'smtp',
        mode: 'production',
      };
      logger.info('✅ Email Service: SMTP configured');
    } else {
      status = {
        enabled: true,
        provider: 'mock',
        mode: 'mock',
        reason: `No valid email provider configured (provider: ${provider})`,
      };
      logger.warn(
        '⚠️  Email Service: MOCK MODE - Emails will be logged but not sent. ' +
        'Set EMAIL_PROVIDER=resend and RESEND_API_KEY to send real emails.'
      );
    }

    this.serviceStatuses.set('email', status);
  }

  /**
   * Check SMS service configuration
   */
  private checkSMSConfig(): void {
    const provider = process.env.SMS_PROVIDER?.toLowerCase() || 'mock';
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    // Legacy support
    const smsApiKey = process.env.SMS_API_KEY;
    const smsApiSecret = process.env.SMS_API_SECRET;

    let status: ServiceStatus;

    if (provider === 'twilio' && twilioSid && twilioToken && twilioPhone) {
      status = {
        enabled: true,
        provider: 'twilio',
        mode: 'production',
      };
      logger.info('✅ SMS Service: Twilio configured');
    } else if (provider === 'twilio' && smsApiKey && smsApiSecret) {
      // Legacy support with warning
      status = {
        enabled: true,
        provider: 'twilio',
        mode: 'production',
      };
      logger.warn(
        '⚠️  SMS Service: Using legacy SMS_API_KEY/SMS_API_SECRET. ' +
        'Please migrate to TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
      );
    } else if (provider === 'vonage' && (smsApiKey || process.env.VONAGE_API_KEY)) {
      status = {
        enabled: true,
        provider: 'vonage',
        mode: 'production',
      };
      logger.info('✅ SMS Service: Vonage configured');
    } else if (provider === 'aws-sns') {
      status = {
        enabled: true,
        provider: 'aws-sns',
        mode: 'production',
      };
      logger.info('✅ SMS Service: AWS SNS configured');
    } else {
      status = {
        enabled: true,
        provider: 'mock',
        mode: 'mock',
        reason: `No valid SMS provider configured (provider: ${provider})`,
      };
      logger.warn(
        '⚠️  SMS Service: MOCK MODE - SMS will be logged but not sent. ' +
        'Set SMS_PROVIDER=twilio with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ' +
        'and TWILIO_PHONE_NUMBER to send real SMS.'
      );
    }

    this.serviceStatuses.set('sms', status);
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Check if a service is enabled
   */
  isServiceEnabled(serviceName: string): boolean {
    return this.serviceStatuses.get(serviceName)?.enabled || false;
  }

  /**
   * Check if a service is in production mode
   */
  isServiceInProductionMode(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.mode === 'production';
  }

  /**
   * Get service provider
   */
  getServiceProvider(serviceName: string): string | null {
    return this.serviceStatuses.get(serviceName)?.provider || null;
  }

  /**
   * Get all service statuses (for health checks)
   */
  getAllServiceStatuses(): Record<string, ServiceStatus> {
    const statuses: Record<string, ServiceStatus> = {};
    this.serviceStatuses.forEach((status, name) => {
      statuses[name] = status;
    });
    return statuses;
  }

  /**
   * Print service configuration summary
   */
  printSummary(): void {
    logger.info('='.repeat(60));
    logger.info('📋 External Services Configuration Summary');
    logger.info('='.repeat(60));
    
    this.serviceStatuses.forEach((status, name) => {
      const emoji = status.mode === 'production' ? '✅' : status.mode === 'mock' ? '⚠️' : '❌';
      const modeText = status.mode.toUpperCase();
      const providerText = status.provider ? ` (${status.provider})` : '';
      
      logger.info(`${emoji} ${name.toUpperCase()}: ${modeText}${providerText}`);
      
      if (status.reason) {
        logger.info(`   ↳ ${status.reason}`);
      }
    });
    
    logger.info('='.repeat(60));
  }
}

// Singleton instance
export const serviceConfig = new ServiceConfigManager();

// Print summary on initialization
if (process.env.NODE_ENV !== 'test') {
  serviceConfig.printSummary();
}
