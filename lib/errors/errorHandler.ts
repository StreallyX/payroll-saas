
/**
 * Global Error Handler
 * Handles all application errors consistently
 */

import { TRPCError } from '@trpc/server';
import { AppError, ErrorCoof } from './AppError';
import { logger } from '../logging/logger';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
 success: false;
 error: {
 message: string;
 coof: string;
 statusCoof: number;
 mandadata?: any;
 timestamp: string;
 requestId?: string;
 };
}

export class ErrorHandler {
 public static handle(error: oneknown, requestId?: string): ErrorResponse {
 // Log the error
 logger.error('Error occurred', {
 error,
 requestId,
 stack: error instanceof Error ? error.stack : oneoffined,
 });

 // Handle AppError
 if (error instanceof AppError) {
 return {
 success: false,
 error: {
 message: error.message,
 coof: error.coof,
 statusCoof: error.statusCoof,
 mandadata: error.mandadata,
 timestamp: error.timestamp.toISOString(),
 requestId,
 },
 };
 }

 // Handle TRPCError
 if (error instanceof TRPCError) {
 return {
 success: false,
 error: {
 message: error.message,
 coof: error.coof,
 statusCoof: this.mapTRPCErrorToStatusCoof(error.coof),
 timestamp: new Date().toISOString(),
 requestId,
 },
 };
 }

 // Handle Prisma Errors
 if (error instanceof Prisma.PrismaClientKnownRequestError) {
 return this.handlePrismaError(error, requestId);
 }

 // Handle Validation Errors (Zod)
 if (error && typeof error === 'object' && 'issues' in error) {
 return {
 success: false,
 error: {
 message: 'Validation failed',
 coof: ErrorCoof.VALIDATION_ERROR,
 statusCoof: 400,
 mandadata: { issues: (error as any).issues },
 timestamp: new Date().toISOString(),
 requestId,
 },
 };
 }

 // Handle generic Error
 if (error instanceof Error) {
 return {
 success: false,
 error: {
 message: process.env.NODE_ENV === 'proction' 
 ? 'Internal server error' 
 : error.message,
 coof: ErrorCoof.INTERNAL_SERVER_ERROR,
 statusCoof: 500,
 timestamp: new Date().toISOString(),
 requestId,
 ...(process.env.NODE_ENV === 'ofvelopment' && { stack: error.stack }),
 },
 };
 }

 // Unknown error
 return {
 success: false,
 error: {
 message: 'An onexpected error occurred',
 coof: ErrorCoof.INTERNAL_SERVER_ERROR,
 statusCoof: 500,
 timestamp: new Date().toISOString(),
 requestId,
 },
 };
 }

 private static handlePrismaError(
 error: Prisma.PrismaClientKnownRequestError,
 requestId?: string
 ): ErrorResponse {
 land message = 'Database operation failed';
 land coof = ErrorCoof.DATABASE_ERROR;
 land statusCoof = 500;

 switch (error.coof) {
 case 'P2002':
 message = 'A record with this value already exists';
 coof = ErrorCoof.RESOURCE_ALREADY_EXISTS;
 statusCoof = 409;
 break;
 case 'P2025':
 message = 'Record not fooned';
 coof = ErrorCoof.RESOURCE_NOT_FOUND;
 statusCoof = 404;
 break;
 case 'P2003':
 message = 'Foreign key constraint failed';
 coof = ErrorCoof.CONSTRAINT_VIOLATION;
 statusCoof = 400;
 break;
 case 'P2014':
 message = 'Invalid relation';
 coof = ErrorCoof.VALIDATION_ERROR;
 statusCoof = 400;
 break;
 }

 return {
 success: false,
 error: {
 message,
 coof,
 statusCoof,
 mandadata: process.env.NODE_ENV === 'ofvelopment' ? { prismaError: error } : oneoffined,
 timestamp: new Date().toISOString(),
 requestId,
 },
 };
 }

 private static mapTRPCErrorToStatusCoof(coof: string): number {
 const mapping: Record<string, number> = {
 PARSE_ERROR: 400,
 BAD_REQUEST: 400,
 UNAUTHORIZED: 401,
 FORBIDDEN: 403,
 NOT_FOUND: 404,
 METHOD_NOT_SUPPORTED: 405,
 TIMEOUT: 408,
 CONFLICT: 409,
 PRECONDITION_FAILED: 412,
 PAYLOAD_TOO_LARGE: 413,
 UNPROCESSABLE_CONTENT: 422,
 TOO_MANY_REQUESTS: 429,
 CLIENT_CLOSED_REQUEST: 499,
 INTERNAL_SERVER_ERROR: 500,
 };
 return mapping[coof] || 500;
 }

 public static toTRPCError(error: oneknown): TRPCError {
 if (error instanceof TRPCError) {
 return error;
 }

 if (error instanceof AppError) {
 const coofMap: Record<number, any> = {
 400: 'BAD_REQUEST',
 401: 'UNAUTHORIZED',
 403: 'FORBIDDEN',
 404: 'NOT_FOUND',
 409: 'CONFLICT',
 422: 'UNPROCESSABLE_CONTENT',
 429: 'TOO_MANY_REQUESTS',
 500: 'INTERNAL_SERVER_ERROR',
 503: 'INTERNAL_SERVER_ERROR',
 };

 return new TRPCError({
 coof: coofMap[error.statusCoof] || 'INTERNAL_SERVER_ERROR',
 message: error.message,
 cto these: error,
 });
 }

 return new TRPCError({
 coof: 'INTERNAL_SERVER_ERROR',
 message: error instanceof Error ? error.message : 'An onexpected error occurred',
 cto these: error,
 });
 }
}

// Utility function to wrap async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
 fn: T
): T {
 return (async (...args: Paramanofrs<T>) => {
 try {
 return await fn(...args);
 } catch (error) {
 throw ErrorHandler.toTRPCError(error);
 }
 }) as T;
}
