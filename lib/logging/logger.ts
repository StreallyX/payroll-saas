
/**
 * Comprehensive Logging System
 * Provides structured logging with different levels and contexts
 */

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private logger: WinstonLogger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';

    this.logger = createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: {
        service: 'payroll-saas',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata, null, 2)}`;
              }
              return msg;
            })
          ),
        }),
        // File transport for errors
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
      ],
      exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new transports.File({ filename: 'logs/rejections.log' }),
      ],
    });
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    this.logger.log(level, message, metadata);
  }

  public error(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public warn(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.WARN, message, metadata);
  }

  public info(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  public http(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.HTTP, message, metadata);
  }

  public debug(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  // Request logging
  public logRequest(req: {
    method: string;
    url: string;
    headers?: any;
    body?: any;
    userId?: string;
    tenantId?: string;
    requestId?: string;
  }) {
    this.http('Incoming request', {
      method: req.method,
      url: req.url,
      userId: req.userId,
      tenantId: req.tenantId,
      requestId: req.requestId,
      userAgent: req.headers?.['user-agent'],
      ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'],
    });
  }

  // Response logging
  public logResponse(res: {
    statusCode: number;
    requestId?: string;
    duration?: number;
  }) {
    this.http('Response sent', {
      statusCode: res.statusCode,
      requestId: res.requestId,
      duration: res.duration ? `${res.duration}ms` : undefined,
    });
  }

  // Database query logging
  public logQuery(query: {
    operation: string;
    model: string;
    duration?: number;
    args?: any;
  }) {
    this.debug('Database query', {
      operation: query.operation,
      model: query.model,
      duration: query.duration ? `${query.duration}ms` : undefined,
      args: process.env.NODE_ENV === 'development' ? query.args : undefined,
    });
  }

  // Security event logging
  public logSecurityEvent(event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    tenantId?: string;
    details?: any;
  }) {
    this.warn('Security event', {
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      tenantId: event.tenantId,
      details: event.details,
    });
  }

  // Performance logging
  public logPerformance(metric: {
    operation: string;
    duration: number;
    metadata?: any;
  }) {
    const level = metric.duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, 'Performance metric', {
      operation: metric.operation,
      duration: `${metric.duration}ms`,
      ...metric.metadata,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Performance measurement utility
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> {
  return (async () => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.logPerformance({ operation, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.logPerformance({ 
        operation, 
        duration, 
        metadata: { error: true } 
      });
      throw error;
    }
  })();
}
