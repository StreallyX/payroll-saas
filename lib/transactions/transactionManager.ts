
/**
 * Transaction Management System
 * Provides utilities for managing database transactions
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DatabaseError } from '../errors';
import { logger } from '../logging';

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface TransactionOptions {
  maxWait?: number; // Maximum wait time in ms
  timeout?: number; // Transaction timeout in ms
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

class TransactionManager {
  /**
   * Execute operations in a transaction
   */
  async execute<T>(
    callback: (tx: TransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.debug('Starting transaction', { options });

      const result = await prisma.$transaction(
        async (tx) => {
          return await callback(tx as TransactionClient);
        },
        {
          maxWait: options?.maxWait || 5000,
          timeout: options?.timeout || 10000,
          isolationLevel: options?.isolationLevel,
        }
      );

      const duration = Date.now() - startTime;
      logger.debug('Transaction committed', { duration: `${duration}ms` });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Transaction failed', {
        error,
        duration: `${duration}ms`,
      });

      throw new DatabaseError('Transaction failed', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Execute operations in a read-only transaction
   */
  async executeReadOnly<T>(
    callback: (tx: TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.execute(callback, {
      isolationLevel: 'ReadCommitted',
    });
  }

  /**
   * Execute with retry logic for deadlocks
   */
  async executeWithRetry<T>(
    callback: (tx: TransactionClient) => Promise<T>,
    maxRetries: number = 3,
    options?: TransactionOptions
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(callback, options);
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a deadlock or serialization failure
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        logger.warn('Transaction retry', {
          attempt,
          maxRetries,
          error: lastError.message,
        });

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await this.sleep(delay);
      }
    }

    throw lastError || new DatabaseError('Transaction failed after retries');
  }

  /**
   * Batch operations in a single transaction
   */
  async batch<T>(operations: Array<(tx: TransactionClient) => Promise<T>>): Promise<T[]> {
    return this.execute(async (tx) => {
      const results: T[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const retryableErrors = [
      'P2034', // Prisma: Transaction conflict
      '40001', // PostgreSQL: Serialization failure
      '40P01', // PostgreSQL: Deadlock detected
    ];

    return retryableErrors.some((code) => error.message.includes(code));
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const transactionManager = new TransactionManager();

/**
 * Utility function to execute in transaction
 */
export async function withTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  return transactionManager.execute(callback, options);
}

/**
 * Utility function to execute with retry
 */
export async function withTransactionRetry<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  maxRetries?: number,
  options?: TransactionOptions
): Promise<T> {
  return transactionManager.executeWithRetry(callback, maxRetries, options);
}
