
/**
 * Cache Middleware - Phase 10
 * Middleware for caching tRPC responses
 */

import { TRPCError } from "@trpc/server";
import { cache, CacheKeys } from "@/lib/cache";
import { TRPCContext } from "../trpc";

/**
 * Cache middleware for tRPC procedures
 * Caches the result of a procedure for a specified TTL
 */
export function withCache<T>(
  keyFn: (input: any, ctx: TRPCContext) => string,
  ttl?: number
) {
  return async (opts: {
    ctx: TRPCContext;
    input: any;
    next: () => Promise<T>;
  }) => {
    const cacheKey = keyFn(opts.input, opts.ctx);
    
    // Try to get from cache
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute procedure
    const result = await opts.next();

    // Store in cache
    cache.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Invalidate cache for specific patterns
 */
export function invalidateCache(pattern: string) {
  const stats = cache.getStats();
  const keysToDelete = stats.keys.filter((key) => key.includes(pattern));
  
  keysToDelete.forEach((key) => {
    cache.delete(key);
  });
}

/**
 * Cache decorators for common patterns
 */
export const CacheStrategies = {
  /**
   * Cache user permissions (5 minutes)
   */
  userPermissions: (userId: string) =>
    withCache(
      () => CacheKeys.permissions(userId),
      5 * 60 * 1000 // 5 minutes
    ),

  /**
   * Cache tenant settings (10 minutes)
   */
  tenantSettings: (tenantId: string) =>
    withCache(
      () => CacheKeys.tenantSettings(tenantId),
      10 * 60 * 1000 // 10 minutes
    ),

  /**
   * Cache dashboard stats (2 minutes)
   */
  dashboardStats: (tenantId: string) =>
    withCache(
      () => CacheKeys.dashboardStats(tenantId),
      2 * 60 * 1000 // 2 minutes
    ),
};
