
/**
 * Standardized API Response Format
 * Ensures consistent response structure across all endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
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

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  metadata?: Record<string, any>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Create a paginated success response
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export function paginatedResponse<T>(
  items: T[],
  pagination: PaginationMetadata,
  metadata?: Record<string, any>
): ApiSuccessResponse<PaginatedData<T>> {
  return successResponse(
    {
      items,
      pagination,
    },
    metadata
  );
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Create a list response with optional pagination
 */
export function listResponse<T>(
  items: T[],
  options?: {
    page?: number;
    pageSize?: number;
    totalItems?: number;
    metadata?: Record<string, any>;
  }
): ApiSuccessResponse<T[] | PaginatedData<T>> {
  if (
    options?.page !== undefined &&
    options?.pageSize !== undefined &&
    options?.totalItems !== undefined
  ) {
    const pagination = calculatePagination(
      options.page,
      options.pageSize,
      options.totalItems
    );
    return paginatedResponse(items, pagination, options.metadata);
  }

  return successResponse(items, options?.metadata);
}

/**
 * Create a bulk operation response
 */
export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

export function bulkOperationResponse(
  result: BulkOperationResult,
  metadata?: Record<string, any>
): ApiSuccessResponse<BulkOperationResult> {
  return successResponse(result, metadata);
}
