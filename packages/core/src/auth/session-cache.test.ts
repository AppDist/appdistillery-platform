import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getCachedSession,
  setCachedSession,
  invalidateSession,
  invalidateAllSessions,
  getCacheStats,
} from './session-cache'
import type { SessionContext } from './index'

describe('session-cache', () => {
  // Mock session data
  const userId = 'user-123'
  const mockSession: SessionContext = {
    user: {
      id: userId,
      displayName: 'Test User',
      email: 'test@example.com',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    tenant: {
      id: 'tenant-456',
      type: 'organization',
      name: 'Test Org',
      slug: 'test-org',
      orgNumber: null,
      billingEmail: null,
      settings: {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    membership: {
      id: 'membership-789',
      tenantId: 'tenant-456',
      userId: userId,
      role: 'admin',
      joinedAt: new Date('2024-01-05'),
    },
  }

  beforeEach(() => {
    // Clear cache before each test
    invalidateAllSessions()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCachedSession', () => {
    it('returns null when cache is empty', () => {
      const result = getCachedSession(userId)
      expect(result).toBeNull()
    })

    it('returns cached session when valid', () => {
      setCachedSession(userId, mockSession)

      const result = getCachedSession(userId)

      expect(result).toEqual(mockSession)
    })

    it('returns null when cache entry has expired', () => {
      vi.useFakeTimers()

      setCachedSession(userId, mockSession)

      // Fast-forward time by 31 seconds (beyond 30s TTL)
      vi.advanceTimersByTime(31_000)

      const result = getCachedSession(userId)

      expect(result).toBeNull()
    })

    it('removes expired entries from cache', () => {
      vi.useFakeTimers()

      setCachedSession(userId, mockSession)

      // Verify entry exists
      expect(getCacheStats().size).toBe(1)

      // Fast-forward time past expiry
      vi.advanceTimersByTime(31_000)

      // Access should remove expired entry
      getCachedSession(userId)

      // Cache should now be empty
      expect(getCacheStats().size).toBe(0)
    })

    it('returns correct session for different users', () => {
      const userId2 = 'user-456'
      const mockSession2: SessionContext = {
        ...mockSession,
        user: {
          ...mockSession.user,
          id: userId2,
          email: 'user2@example.com',
        },
      }

      setCachedSession(userId, mockSession)
      setCachedSession(userId2, mockSession2)

      expect(getCachedSession(userId)).toEqual(mockSession)
      expect(getCachedSession(userId2)).toEqual(mockSession2)
    })
  })

  describe('setCachedSession', () => {
    it('stores session in cache', () => {
      setCachedSession(userId, mockSession)

      const result = getCachedSession(userId)

      expect(result).toEqual(mockSession)
    })

    it('overwrites existing cache entry', () => {
      const updatedSession: SessionContext = {
        ...mockSession,
        user: {
          ...mockSession.user,
          displayName: 'Updated Name',
        },
      }

      setCachedSession(userId, mockSession)
      setCachedSession(userId, updatedSession)

      const result = getCachedSession(userId)

      expect(result).toEqual(updatedSession)
      expect(result?.user.displayName).toBe('Updated Name')
    })

    it('caches sessions for multiple users independently', () => {
      const userId2 = 'user-789'
      const mockSession2: SessionContext = {
        ...mockSession,
        user: {
          ...mockSession.user,
          id: userId2,
        },
      }

      setCachedSession(userId, mockSession)
      setCachedSession(userId2, mockSession2)

      expect(getCacheStats().size).toBe(2)
    })
  })

  describe('invalidateSession', () => {
    it('removes specific user from cache', () => {
      setCachedSession(userId, mockSession)

      expect(getCachedSession(userId)).toEqual(mockSession)

      invalidateSession(userId)

      expect(getCachedSession(userId)).toBeNull()
    })

    it('does not affect other users in cache', () => {
      const userId2 = 'user-456'
      const mockSession2: SessionContext = {
        ...mockSession,
        user: {
          ...mockSession.user,
          id: userId2,
        },
      }

      setCachedSession(userId, mockSession)
      setCachedSession(userId2, mockSession2)

      invalidateSession(userId)

      expect(getCachedSession(userId)).toBeNull()
      expect(getCachedSession(userId2)).toEqual(mockSession2)
    })

    it('is safe to call for non-existent user', () => {
      expect(() => invalidateSession('non-existent-user')).not.toThrow()
    })
  })

  describe('invalidateAllSessions', () => {
    it('clears all cached sessions', () => {
      const userId2 = 'user-456'
      const userId3 = 'user-789'

      setCachedSession(userId, mockSession)
      setCachedSession(userId2, mockSession)
      setCachedSession(userId3, mockSession)

      expect(getCacheStats().size).toBe(3)

      invalidateAllSessions()

      expect(getCacheStats().size).toBe(0)
      expect(getCachedSession(userId)).toBeNull()
      expect(getCachedSession(userId2)).toBeNull()
      expect(getCachedSession(userId3)).toBeNull()
    })

    it('is safe to call on empty cache', () => {
      expect(() => invalidateAllSessions()).not.toThrow()
      expect(getCacheStats().size).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    it('returns zero for empty cache', () => {
      const stats = getCacheStats()

      expect(stats.size).toBe(0)
      expect(stats.entries).toBe(0)
    })

    it('returns correct count for active entries', () => {
      setCachedSession(userId, mockSession)
      setCachedSession('user-456', mockSession)

      const stats = getCacheStats()

      expect(stats.size).toBe(2)
      expect(stats.entries).toBe(2)
    })

    it('cleans up expired entries before reporting stats', () => {
      vi.useFakeTimers()

      setCachedSession(userId, mockSession)
      setCachedSession('user-456', mockSession)

      expect(getCacheStats().size).toBe(2)

      // Fast-forward past expiry
      vi.advanceTimersByTime(31_000)

      // getCacheStats should clean up expired entries
      const stats = getCacheStats()

      expect(stats.size).toBe(0)
    })

    it('only removes expired entries, keeps valid ones', () => {
      vi.useFakeTimers()

      // Add first entry
      setCachedSession(userId, mockSession)

      // Fast-forward 20 seconds (within TTL)
      vi.advanceTimersByTime(20_000)

      // Add second entry (will have fresh timestamp)
      const userId2 = 'user-456'
      setCachedSession(userId2, mockSession)

      // Fast-forward another 15 seconds (total 35s from first entry, 15s from second)
      vi.advanceTimersByTime(15_000)

      // First entry expired (35s), second still valid (15s)
      const stats = getCacheStats()

      expect(stats.size).toBe(1)
      expect(getCachedSession(userId)).toBeNull()
      expect(getCachedSession(userId2)).toEqual(mockSession)
    })
  })

  describe('cache TTL behavior', () => {
    it('respects 30-second TTL', () => {
      vi.useFakeTimers()

      setCachedSession(userId, mockSession)

      // Just before expiry (29.9s)
      vi.advanceTimersByTime(29_900)
      expect(getCachedSession(userId)).toEqual(mockSession)

      // Just after expiry (30.1s total)
      vi.advanceTimersByTime(200)
      expect(getCachedSession(userId)).toBeNull()
    })

    it('refreshes TTL on cache update', () => {
      vi.useFakeTimers()

      setCachedSession(userId, mockSession)

      // Fast-forward 20 seconds
      vi.advanceTimersByTime(20_000)

      // Update cache (resets TTL)
      const updatedSession: SessionContext = {
        ...mockSession,
        user: {
          ...mockSession.user,
          displayName: 'Updated',
        },
      }
      setCachedSession(userId, updatedSession)

      // Fast-forward another 25 seconds (45s from original, 25s from update)
      vi.advanceTimersByTime(25_000)

      // Original would be expired (45s), but update reset TTL (25s)
      expect(getCachedSession(userId)).toEqual(updatedSession)

      // Fast-forward another 10 seconds (55s from original, 35s from update)
      vi.advanceTimersByTime(10_000)

      // Now expired
      expect(getCachedSession(userId)).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles session with null tenant', () => {
      const personalSession: SessionContext = {
        user: mockSession.user,
        tenant: null,
        membership: null,
      }

      setCachedSession(userId, personalSession)

      const result = getCachedSession(userId)

      expect(result).toEqual(personalSession)
      expect(result?.tenant).toBeNull()
      expect(result?.membership).toBeNull()
    })

    it('handles session with null display name and avatar', () => {
      const minimalSession: SessionContext = {
        user: {
          id: userId,
          displayName: null,
          email: 'test@example.com',
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tenant: null,
        membership: null,
      }

      setCachedSession(userId, minimalSession)

      const result = getCachedSession(userId)

      expect(result?.user.displayName).toBeNull()
      expect(result?.user.avatarUrl).toBeNull()
    })

    it('maintains object references correctly', () => {
      setCachedSession(userId, mockSession)

      const result = getCachedSession(userId)

      // Should be deep equal but not same reference
      expect(result).toEqual(mockSession)
      // Cache returns the same object reference (by design for performance)
      expect(result).toBe(mockSession)
    })
  })
})
