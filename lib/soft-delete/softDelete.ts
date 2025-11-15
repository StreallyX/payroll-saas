
/**
 * Soft Delete Utilities
 * Provides utilities for soft deleting records instead of hard deletes
 */

import { Prisma } from '@prisma/client';
import { TransactionClient } from '../transactions';
import { logger } from '../logging';
import { NotFoundError } from '../errors';

export interface SoftDeleteOptions {
  tenantId?: string;
  userId?: string;
  reason?: string;
}

export interface SoftDeletedRecord {
  id: string;
  deletedAt: Date;
  deletedBy?: string;
  deleteReason?: string;
}

class SoftDeleteManager {
  /**
   * Soft delete a record by updating deletedAt field
   */
  async softDelete<T extends { id: string }>(
    model: any,
    id: string,
    options?: SoftDeleteOptions,
    tx?: TransactionClient
  ): Promise<T> {
    const client = tx || (global as any).prisma;

    try {
      const record = await client[model].update({
        where: { id },
        data: {
          deletedAt: new Date(),
          ...(options?.userId && { deletedBy: options.userId }),
          ...(options?.reason && { deleteReason: options.reason }),
        },
      });

      logger.info('Record soft deleted', {
        model,
        id,
        deletedBy: options?.userId,
        tenantId: options?.tenantId,
      });

      return record;
    } catch (error) {
      logger.error('Soft delete failed', { model, id, error });
      throw new NotFoundError(`${model} with id ${id}`);
    }
  }

  /**
   * Bulk soft delete records
   */
  async softDeleteMany<T>(
    model: any,
    ids: string[],
    options?: SoftDeleteOptions,
    tx?: TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || (global as any).prisma;

    try {
      const result = await client[model].updateMany({
        where: { id: { in: ids } },
        data: {
          deletedAt: new Date(),
          ...(options?.userId && { deletedBy: options.userId }),
          ...(options?.reason && { deleteReason: options.reason }),
        },
      });

      logger.info('Records soft deleted', {
        model,
        count: result.count,
        deletedBy: options?.userId,
        tenantId: options?.tenantId,
      });

      return result;
    } catch (error) {
      logger.error('Bulk soft delete failed', { model, ids, error });
      throw error;
    }
  }

  /**
   * Restore a soft deleted record
   */
  async restore<T extends { id: string }>(
    model: any,
    id: string,
    options?: { userId?: string; tenantId?: string },
    tx?: TransactionClient
  ): Promise<T> {
    const client = tx || (global as any).prisma;

    try {
      const record = await client[model].update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
        },
      });

      logger.info('Record restored', {
        model,
        id,
        restoredBy: options?.userId,
        tenantId: options?.tenantId,
      });

      return record;
    } catch (error) {
      logger.error('Restore failed', { model, id, error });
      throw new NotFoundError(`${model} with id ${id}`);
    }
  }

  /**
   * Permanently delete a soft deleted record
   */
  async permanentDelete(
    model: any,
    id: string,
    options?: { userId?: string; tenantId?: string },
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || (global as any).prisma;

    try {
      await client[model].delete({
        where: { id },
      });

      logger.warn('Record permanently deleted', {
        model,
        id,
        deletedBy: options?.userId,
        tenantId: options?.tenantId,
      });
    } catch (error) {
      logger.error('Permanent delete failed', { model, id, error });
      throw new NotFoundError(`${model} with id ${id}`);
    }
  }

  /**
   * Get soft deleted records
   */
  async findDeleted<T>(
    model: any,
    filter?: any,
    tx?: TransactionClient
  ): Promise<T[]> {
    const client = tx || (global as any).prisma;

    return client[model].findMany({
      where: {
        ...filter,
        deletedAt: { not: null },
      },
    });
  }

  /**
   * Count soft deleted records
   */
  async countDeleted(
    model: any,
    filter?: any,
    tx?: TransactionClient
  ): Promise<number> {
    const client = tx || (global as any).prisma;

    return client[model].count({
      where: {
        ...filter,
        deletedAt: { not: null },
      },
    });
  }

  /**
   * Clean up old soft deleted records (older than specified days)
   */
  async cleanupOldDeleted(
    model: any,
    daysOld: number,
    options?: { tenantId?: string },
    tx?: TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || (global as any).prisma;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await client[model].deleteMany({
        where: {
          deletedAt: {
            not: null,
            lt: cutoffDate,
          },
          ...(options?.tenantId && { tenantId: options.tenantId }),
        },
      });

      logger.info('Old deleted records cleaned up', {
        model,
        count: result.count,
        olderThanDays: daysOld,
        tenantId: options?.tenantId,
      });

      return result;
    } catch (error) {
      logger.error('Cleanup failed', { model, daysOld, error });
      throw error;
    }
  }
}

// Singleton instance
export const softDeleteManager = new SoftDeleteManager();

/**
 * Create middleware to exclude soft deleted records by default
 */
export function createSoftDeleteMiddleware() {
  return async (params: any, next: any) => {
    // Skip for delete operations
    if (params.action === 'delete' || params.action === 'deleteMany') {
      return next(params);
    }

    // Add deletedAt: null filter for read operations
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'findMany' ||
      params.action === 'count'
    ) {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    return next(params);
  };
}

/**
 * Utility functions for common soft delete operations
 */
export const softDelete = {
  /**
   * Soft delete a record
   */
  async delete<T extends { id: string }>(
    model: any,
    id: string,
    options?: SoftDeleteOptions,
    tx?: TransactionClient
  ): Promise<T> {
    return softDeleteManager.softDelete(model, id, options, tx);
  },

  /**
   * Restore a record
   */
  async restore<T extends { id: string }>(
    model: any,
    id: string,
    options?: { userId?: string; tenantId?: string },
    tx?: TransactionClient
  ): Promise<T> {
    return softDeleteManager.restore(model, id, options, tx);
  },

  /**
   * Permanently delete
   */
  async permanentDelete(
    model: any,
    id: string,
    options?: { userId?: string; tenantId?: string },
    tx?: TransactionClient
  ): Promise<void> {
    return softDeleteManager.permanentDelete(model, id, options, tx);
  },
};
