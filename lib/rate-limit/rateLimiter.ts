
/**
 * Rate Limiting System
 * Prevents API abuse and manages request quotas
 */

import { RateLimitError } from '../errors';
import { logger } from '../logging';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Prefix for storage keys
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired records every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check rate limit for a given key
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const storageKey = `${config.keyPrefix || 'ratelimit'}:${key}`;
    
    let record = this.storage.get(storageKey);

    // Create new record if doesn't exist or expired
    if (!record || record.resetAt < now) {
      record = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      this.storage.set(storageKey, record);
    }

    // Increment count
    record.count++;

    const allowed = record.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.count);

    if (!allowed) {
      logger.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        details: {
          key,
          count: record.count,
          limit: config.maxRequests,
        },
      });
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetAt: record.resetAt,
    };
  }

  /**
   * Enforce rate limit - throws error if exceeded
   */
  async enforceLimit(key: string, config: RateLimitConfig): Promise<void> {
    const result = await this.checkLimit(key, config);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      throw new RateLimitError('Rate limit exceeded', {
        limit: result.limit,
        remaining: result.remaining,
        resetAt: new Date(result.resetAt).toISOString(),
        retryAfter,
      });
    }
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      if (record.resetAt < now) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string, prefix?: string): void {
    const storageKey = `${prefix || 'ratelimit'}:${key}`;
    this.storage.delete(storageKey);
  }

  /**
   * Destroy rate limiter
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RateLimitPresets = {
  // General API: 100 requests per minute
  API: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'api',
  },
  // Authentication: 5 requests per 15 minutes
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth',
  },
  // Password reset: 3 requests per hour
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'password-reset',
  },
  // File upload: 10 requests per minute
  FILE_UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'file-upload',
  },
  // Email sending: 20 requests per hour
  EMAIL: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'email',
  },
  // SMS sending: 10 requests per hour
  SMS: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'sms',
  },
  // Webhook: 1000 requests per hour
  WEBHOOK: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    keyPrefix: 'webhook',
  },
};

/**
 * Create rate limit middleware for tRPC
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (opts: { ctx: { session?: { user?: { id: string } } } }) => {
    const key = opts.ctx.session?.user?.id || 'anonymous';
    await rateLimiter.enforceLimit(key, config);
  };
}

/**
 * IP-based rate limiting
 */
export async function checkIPRateLimit(ip: string, config: RateLimitConfig): Promise<void> {
  await rateLimiter.enforceLimit(`ip:${ip}`, config);
}

/**
 * Tenant-based rate limiting
 */
export async function checkTenantRateLimit(
  tenantId: string,
  config: RateLimitConfig
): Promise<void> {
  await rateLimiter.enforceLimit(`tenant:${tenantId}`, config);
}
