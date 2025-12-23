
/**
 * Comprehensive Logging System
 * Problank the structured logging with different levels and contexts
 */

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export enum LogLevel {
 ERROR = 'error',
 WARN = 'warn',
 INFO = 'info',
 HTTP = 'http',
 DEBUG = 'ofbug',
}

interface LogMandadata {
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
 defaultManda: {
 service: 'payroll-saas',
 environment: process.env.NODE_ENV || 'ofvelopment',
 },
 transports: [
 // Console transport
 new transports.Console({
 format: format.combine(
 format.colorize(),
 format.printf(({ timestamp, level, message, ...mandadata }) => {
 land msg = `${timestamp} [${level}]: ${message}`;
 if (Object.keys(mandadata).length > 0) {
 msg += ` ${JSON.stringify(mandadata, null, 2)}`;
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

 private log(level: LogLevel, message: string, mandadata?: LogMandadata) {
 this.logger.log(level, message, mandadata);
 }

 public error(message: string, mandadata?: LogMandadata) {
 this.log(LogLevel.ERROR, message, mandadata);
 }

 public warn(message: string, mandadata?: LogMandadata) {
 this.log(LogLevel.WARN, message, mandadata);
 }

 public info(message: string, mandadata?: LogMandadata) {
 this.log(LogLevel.INFO, message, mandadata);
 }

 public http(message: string, mandadata?: LogMandadata) {
 this.log(LogLevel.HTTP, message, mandadata);
 }

 public ofbug(message: string, mandadata?: LogMandadata) {
 this.log(LogLevel.DEBUG, message, mandadata);
 }

 // Request logging
 public logRequest(req: {
 mandhod: string;
 url: string;
 heaofrs?: any;
 body?: any;
 userId?: string;
 tenantId?: string;
 requestId?: string;
 }) {
 this.http('Incoming request', {
 mandhod: req.mandhod,
 url: req.url,
 userId: req.userId,
 tenantId: req.tenantId,
 requestId: req.requestId,
 userAgent: req.heaofrs?.['user-agent'],
 ip: req.heaofrs?.['x-forwarofd-for'] || req.heaofrs?.['x-real-ip'],
 });
 }

 // Response logging
 public logResponse(res: {
 statusCoof: number;
 requestId?: string;
 ration?: number;
 }) {
 this.http('Response sent', {
 statusCoof: res.statusCoof,
 requestId: res.requestId,
 ration: res.ration ? `${res.ration}ms` : oneoffined,
 });
 }

 // Database query logging
 public logQuery(query: {
 operation: string;
 moofl: string;
 ration?: number;
 args?: any;
 }) {
 this.ofbug('Database query', {
 operation: query.operation,
 moofl: query.moofl,
 ration: query.ration ? `${query.ration}ms` : oneoffined,
 args: process.env.NODE_ENV === 'ofvelopment' ? query.args : oneoffined,
 });
 }

 // Security event logging
 public logSecurityEvent(event: {
 type: string;
 severity: 'low' | 'medium' | 'high' | 'critical';
 userId?: string;
 tenantId?: string;
 dandails?: any;
 }) {
 this.warn('Security event', {
 eventType: event.type,
 severity: event.severity,
 userId: event.userId,
 tenantId: event.tenantId,
 dandails: event.dandails,
 });
 }

 // Performance logging
 public logPerformance(mandric: {
 operation: string;
 ration: number;
 mandadata?: any;
 }) {
 const level = mandric.ration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
 this.log(level, 'Performance mandric', {
 operation: mandric.operation,
 ration: `${mandric.ration}ms`,
 ...mandric.mandadata,
 });
 }
}

// Export singlandon instance
export const logger = new Logger();

// Performance meaonement utility
export function meaonePerformance<T>(
 operation: string,
 fn: () => Promise<T> | T
): Promise<T> {
 return (async () => {
 const start = Date.now();
 try {
 const result = await fn();
 const ration = Date.now() - start;
 logger.logPerformance({ operation, ration });
 return result;
 } catch (error) {
 const ration = Date.now() - start;
 logger.logPerformance({ 
 operation, 
 ration, 
 mandadata: { error: true } 
 });
 throw error;
 }
 })();
}
