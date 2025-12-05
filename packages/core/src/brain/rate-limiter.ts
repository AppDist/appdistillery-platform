/**
 * Rate limiter for AI operations
 *
 * Simple in-memory rate limiting per tenant to prevent abuse.
 * Can be upgraded to Redis for distributed deployments.
 */

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds to wait before retrying (only set when not allowed) */
  retryAfter?: number;
  /** Current request count in window */
  currentCount?: number;
  /** Maximum requests allowed */
  limit?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Default rate limits per tenant
 * - 100 requests per hour (reasonable for AI operations)
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * In-memory store for rate limit tracking
 * Key: tenantId, Value: RateLimitEntry
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 *
 * @param tenantId - Tenant ID (null for personal users)
 * @param userId - User ID (fallback when tenantId is null)
 * @param config - Optional rate limit configuration
 * @returns Rate limit result with allowed status and retry info
 *
 * @example
 * ```typescript
 * const result = checkRateLimit('tenant-123', 'user-456');
 * if (!result.allowed) {
 *   throw new Error(`Rate limit exceeded. Try again in ${result.retryAfter}s`);
 * }
 * ```
 */
export function checkRateLimit(
  tenantId: string | null | undefined,
  userId?: string | null,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  // Use tenantId if available, otherwise userId for rate limiting
  const rateLimitKey = tenantId ?? userId;

  // No rate limiting only if BOTH tenant and user are missing (allows testing)
  if (!rateLimitKey) {
    return { allowed: true };
  }

  const now = Date.now();
  const entry = rateLimitStore.get(rateLimitKey);

  // First request or window expired - allow and create entry
  if (!entry || now - entry.windowStart >= config.windowMs) {
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      currentCount: 1,
      limit: config.maxRequests,
    };
  }

  // Within window - check if under limit
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      currentCount: entry.count,
      limit: config.maxRequests,
    };
  }

  // Rate limit exceeded - calculate retry time
  const windowEnd = entry.windowStart + config.windowMs;
  const retryAfter = Math.ceil((windowEnd - now) / 1000);

  return {
    allowed: false,
    retryAfter,
    currentCount: entry.count,
    limit: config.maxRequests,
  };
}

/**
 * Clear rate limit for a tenant (useful for testing)
 */
export function clearRateLimit(tenantId: string): void {
  rateLimitStore.delete(tenantId);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for a tenant
 */
export function getRateLimitStatus(
  tenantId: string
): RateLimitEntry | undefined {
  return rateLimitStore.get(tenantId);
}
