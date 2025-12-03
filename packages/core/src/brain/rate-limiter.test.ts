import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  clearRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  type RateLimitConfig,
} from './rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearAllRateLimits();
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('allows requests for null tenantId', () => {
      const result = checkRateLimit(null);

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('allows requests for undefined tenantId', () => {
      const result = checkRateLimit(undefined);

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('allows first request and initializes counter', () => {
      const result = checkRateLimit('tenant-123');

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
      expect(result.limit).toBe(100); // Default limit
    });

    it('allows requests under limit', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };

      const result1 = checkRateLimit('tenant-123', config);
      const result2 = checkRateLimit('tenant-123', config);
      const result3 = checkRateLimit('tenant-123', config);

      expect(result1.allowed).toBe(true);
      expect(result1.currentCount).toBe(1);
      expect(result2.allowed).toBe(true);
      expect(result2.currentCount).toBe(2);
      expect(result3.allowed).toBe(true);
      expect(result3.currentCount).toBe(3);
    });

    it('blocks requests over limit', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };

      checkRateLimit('tenant-123', config); // 1
      checkRateLimit('tenant-123', config); // 2
      const result = checkRateLimit('tenant-123', config); // Over limit

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.currentCount).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('resets counter after window expires', () => {
      vi.useFakeTimers();
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 };

      // Fill up limit
      checkRateLimit('tenant-123', config);
      checkRateLimit('tenant-123', config);
      let result = checkRateLimit('tenant-123', config);
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1001);

      // Should allow new requests
      result = checkRateLimit('tenant-123', config);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);

      vi.useRealTimers();
    });

    it('isolates rate limits by tenant', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      const result1 = checkRateLimit('tenant-A', config);
      const result2 = checkRateLimit('tenant-B', config);
      const result3 = checkRateLimit('tenant-A', config);

      expect(result1.allowed).toBe(true); // tenant-A first request
      expect(result2.allowed).toBe(true); // tenant-B first request
      expect(result3.allowed).toBe(false); // tenant-A over limit
    });
  });

  describe('clearRateLimit', () => {
    it('clears rate limit for specific tenant', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      checkRateLimit('tenant-123', config);
      const result1 = checkRateLimit('tenant-123', config);
      expect(result1.allowed).toBe(false);

      clearRateLimit('tenant-123');

      const result2 = checkRateLimit('tenant-123', config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('clearAllRateLimits', () => {
    it('clears all rate limits', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      checkRateLimit('tenant-A', config);
      checkRateLimit('tenant-B', config);
      checkRateLimit('tenant-A', config);
      checkRateLimit('tenant-B', config);

      clearAllRateLimits();

      const resultA = checkRateLimit('tenant-A', config);
      const resultB = checkRateLimit('tenant-B', config);
      expect(resultA.allowed).toBe(true);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns undefined for non-existent tenant', () => {
      const status = getRateLimitStatus('tenant-nonexistent');

      expect(status).toBeUndefined();
    });

    it('returns status for existing tenant', () => {
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      checkRateLimit('tenant-123', config);
      checkRateLimit('tenant-123', config);

      const status = getRateLimitStatus('tenant-123');

      expect(status).toBeDefined();
      expect(status?.count).toBe(2);
      expect(status?.windowStart).toBeGreaterThan(0);
    });
  });
});
