import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    units: number;
  };
  expiresAt: number;
}

/**
 * In-memory cache store
 *
 * Simple Map-based cache. Can be upgraded to Redis for distributed caching.
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Default cache TTL (1 hour in milliseconds)
 */
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Generate stable hash from object
 *
 * @param obj - Object to hash
 * @returns SHA256 hash string
 */
function hashObject(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as object).sort());
  return createHash('sha256').update(str).digest('hex');
}

/**
 * Generate cache key for brain task
 *
 * Key combines: taskType + prompt hash + schema hash for uniqueness
 *
 * @param taskType - Task type in format 'module.task'
 * @param systemPrompt - System prompt
 * @param userPrompt - User prompt
 * @param schema - Zod schema
 * @returns Cache key string
 */
export function generateCacheKey<T extends z.ZodType>(
  taskType: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): string {
  const promptHash = hashObject({ systemPrompt, userPrompt });
  // Use schema description for hashing (stable across instances)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaDescription = schema.description ?? JSON.stringify((schema as any).shape ?? schema._def);
  const schemaHash = hashObject(schemaDescription);

  return `${taskType}:${promptHash}:${schemaHash}`;
}

/**
 * Get cached response if available and not expired
 *
 * @param cacheKey - Cache key from generateCacheKey
 * @returns Cached result or null
 */
export function getCachedResponse<T>(
  cacheKey: string
): { data: T; usage: CacheEntry<T>['usage']; fromCache: true } | null {
  const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  // Check expiration
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }

  return {
    data: entry.data,
    usage: entry.usage,
    fromCache: true,
  };
}

/**
 * Cache a successful response
 *
 * @param cacheKey - Cache key from generateCacheKey
 * @param data - Response data to cache
 * @param usage - Usage metadata
 * @param ttlMs - Time to live in milliseconds (default: 1 hour)
 */
export function setCachedResponse<T>(
  cacheKey: string,
  data: T,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    units: number;
  },
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const expiresAt = Date.now() + ttlMs;

  cache.set(cacheKey, {
    data,
    usage,
    expiresAt,
  });
}

/**
 * Clear specific cache entry
 *
 * @param cacheKey - Cache key to clear
 * @returns True if entry existed
 */
export function clearCacheEntry(cacheKey: string): boolean {
  return cache.delete(cacheKey);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 *
 * @returns Cache stats
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Clean up expired entries
 *
 * Should be called periodically to prevent memory leaks.
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}
