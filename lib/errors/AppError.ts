
/**
 * Custom Application Error Classes
 * Provides comprehensive error handling with detailed error codes and messages
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Generic
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorMetadata {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: ErrorMetadata;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: ErrorMetadata
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

// Specific Error Classes
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', metadata?: ErrorMetadata) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, metadata);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', metadata?: ErrorMetadata) {
    super(message, ErrorCode.FORBIDDEN, 403, true, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', metadata?: ErrorMetadata) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', metadata?: ErrorMetadata) {
    super(`${resource} not found`, ErrorCode.RESOURCE_NOT_FOUND, 404, true, metadata);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', metadata?: ErrorMetadata) {
    super(message, ErrorCode.RESOURCE_ALREADY_EXISTS, 409, true, metadata);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, true, metadata);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', metadata?: ErrorMetadata) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, metadata);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, metadata?: ErrorMetadata) {
    super(
      message || `External service ${service} failed`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
      true,
      metadata
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', metadata?: ErrorMetadata) {
    super(message, ErrorCode.DATABASE_ERROR, 500, false, metadata);
  }
}
