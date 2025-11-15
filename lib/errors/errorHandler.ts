
/**
 * Global Error Handler
 * Handles all application errors consistently
 */

import { TRPCError } from '@trpc/server';
import { AppError, ErrorCode } from './AppError';
import { logger } from '../logging/logger';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    metadata?: any;
    timestamp: string;
    requestId?: string;
  };
}

export class ErrorHandler {
  public static handle(error: unknown, requestId?: string): ErrorResponse {
    // Log the error
    logger.error('Error occurred', {
      error,
      requestId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle AppError
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          metadata: error.metadata,
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
          code: error.code,
          statusCode: this.mapTRPCErrorToStatusCode(error.code),
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
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          metadata: { issues: (error as any).issues },
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
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
      };
    }

    // Unknown error
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  private static handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    requestId?: string
  ): ErrorResponse {
    let message = 'Database operation failed';
    let code = ErrorCode.DATABASE_ERROR;
    let statusCode = 500;

    switch (error.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        code = ErrorCode.RESOURCE_ALREADY_EXISTS;
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        code = ErrorCode.RESOURCE_NOT_FOUND;
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        code = ErrorCode.CONSTRAINT_VIOLATION;
        statusCode = 400;
        break;
      case 'P2014':
        message = 'Invalid relation';
        code = ErrorCode.VALIDATION_ERROR;
        statusCode = 400;
        break;
    }

    return {
      success: false,
      error: {
        message,
        code,
        statusCode,
        metadata: process.env.NODE_ENV === 'development' ? { prismaError: error } : undefined,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  private static mapTRPCErrorToStatusCode(code: string): number {
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
    return mapping[code] || 500;
  }

  public static toTRPCError(error: unknown): TRPCError {
    if (error instanceof TRPCError) {
      return error;
    }

    if (error instanceof AppError) {
      const codeMap: Record<number, any> = {
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
        code: codeMap[error.statusCode] || 'INTERNAL_SERVER_ERROR',
        message: error.message,
        cause: error,
      });
    }

    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      cause: error,
    });
  }
}

// Utility function to wrap async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.toTRPCError(error);
    }
  }) as T;
}
