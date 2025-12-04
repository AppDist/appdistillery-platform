/**
 * In-memory session cache
 *
 * Caches session context data to reduce redundant database queries
 * within the same request or across sequential requests.
 *
 * Cache entries expire after 30 seconds to prevent stale data.
 */

import type { SessionContext } from './index'

interface CacheEntry {
  data: SessionContext
  expires: number
}

// In-memory cache storage
const sessionCache = new Map<string, CacheEntry>()

// Cache TTL: 30 seconds
const CACHE_TTL = 30_000

/**
 * Get cached session context for a user
 *
 * @param userId - User ID to retrieve from cache
 * @returns Cached SessionContext if valid, null if expired or missing
 *
 * @example
 * ```typescript
 * const cached = getCachedSession('user-123')
 * if (cached) {
 *   console.log('Cache hit:', cached.user.email)
 * }
 * ```
 */
export function getCachedSession(userId: string): SessionContext | null {
  const entry = sessionCache.get(userId)

  if (!entry) {
    return null
  }

  // Check if expired
  if (Date.now() > entry.expires) {
    // Remove stale entry
    sessionCache.delete(userId)
    return null
  }

  return entry.data
}

/**
 * Store session context in cache
 *
 * @param userId - User ID to cache
 * @param session - SessionContext to store
 *
 * @example
 * ```typescript
 * const session = await fetchSessionFromDB('user-123')
 * setCachedSession('user-123', session)
 * ```
 */
export function setCachedSession(
  userId: string,
  session: SessionContext
): void {
  sessionCache.set(userId, {
    data: session,
    expires: Date.now() + CACHE_TTL,
  })
}

/**
 * Invalidate cached session for a specific user
 *
 * Call this when user data changes (e.g., tenant switch, profile update)
 *
 * @param userId - User ID to invalidate
 *
 * @example
 * ```typescript
 * await switchTenant({ tenantId: 'new-tenant-id' })
 * invalidateSession(userId) // Clear stale cache
 * ```
 */
export function invalidateSession(userId: string): void {
  sessionCache.delete(userId)
}

/**
 * Clear all cached sessions
 *
 * Useful for testing or administrative operations
 *
 * @example
 * ```typescript
 * // In tests
 * beforeEach(() => {
 *   invalidateAllSessions()
 * })
 * ```
 */
export function invalidateAllSessions(): void {
  sessionCache.clear()
}

/**
 * Get cache statistics (for debugging/monitoring)
 *
 * @returns Object with cache size and active entries
 *
 * @internal
 */
export function getCacheStats(): { size: number; entries: number } {
  // Clean up expired entries before reporting stats
  const now = Date.now()
  for (const [userId, entry] of sessionCache.entries()) {
    if (now > entry.expires) {
      sessionCache.delete(userId)
    }
  }

  return {
    size: sessionCache.size,
    entries: sessionCache.size,
  }
}
