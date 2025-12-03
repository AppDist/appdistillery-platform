import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCacheEntry,
  clearCache,
  getCacheStats,
  cleanupExpiredEntries,
} from './cache';

describe('cache', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  describe('generateCacheKey', () => {
    it('generates consistent keys for identical inputs', () => {
      const schema = z.object({ name: z.string() });
      const key1 = generateCacheKey('agency.scope', 'system', 'user', schema);
      const key2 = generateCacheKey('agency.scope', 'system', 'user', schema);

      expect(key1).toBe(key2);
    });

    it('generates different keys for different task types', () => {
      const schema = z.object({ name: z.string() });
      const key1 = generateCacheKey('agency.scope', 'system', 'user', schema);
      const key2 = generateCacheKey('agency.proposal', 'system', 'user', schema);

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different prompts', () => {
      const schema = z.object({ name: z.string() });
      const key1 = generateCacheKey('agency.scope', 'system', 'user1', schema);
      const key2 = generateCacheKey('agency.scope', 'system', 'user2', schema);

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different schemas', () => {
      const schema1 = z.object({ name: z.string() });
      const schema2 = z.object({ email: z.string() });
      const key1 = generateCacheKey('agency.scope', 'system', 'user', schema1);
      const key2 = generateCacheKey('agency.scope', 'system', 'user', schema2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('getCachedResponse', () => {
    it('returns null for non-existent cache key', () => {
      const result = getCachedResponse('non-existent-key');

      expect(result).toBeNull();
    });

    it('returns cached data for valid key', () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data, usage);
      const result = getCachedResponse(cacheKey);

      expect(result).toEqual({
        data,
        usage,
        fromCache: true,
      });
    });

    it('returns null for expired entry', async () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      // Set cache with very short TTL (1ms)
      setCachedResponse(cacheKey, data, usage, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = getCachedResponse(cacheKey);

      expect(result).toBeNull();
    });

    it('removes expired entry when accessed', async () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data, usage, 1);
      await new Promise((resolve) => setTimeout(resolve, 10));

      getCachedResponse(cacheKey);

      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('setCachedResponse', () => {
    it('caches data with default TTL', () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data, usage);
      const result = getCachedResponse(cacheKey);

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(data);
    });

    it('caches data with custom TTL', () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data, usage, 5000);
      const result = getCachedResponse(cacheKey);

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(data);
    });

    it('overwrites existing cache entry', () => {
      const cacheKey = 'test-key';
      const data1 = { name: 'Test1' };
      const data2 = { name: 'Test2' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data1, usage);
      setCachedResponse(cacheKey, data2, usage);

      const result = getCachedResponse(cacheKey);

      expect(result?.data).toEqual(data2);
    });
  });

  describe('clearCacheEntry', () => {
    it('removes specific cache entry', () => {
      const cacheKey = 'test-key';
      const data = { name: 'Test' };
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse(cacheKey, data, usage);
      const removed = clearCacheEntry(cacheKey);

      expect(removed).toBe(true);
      expect(getCachedResponse(cacheKey)).toBeNull();
    });

    it('returns false for non-existent key', () => {
      const removed = clearCacheEntry('non-existent-key');

      expect(removed).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('removes all cache entries', () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse('key1', { name: 'Test1' }, usage);
      setCachedResponse('key2', { name: 'Test2' }, usage);
      setCachedResponse('key3', { name: 'Test3' }, usage);

      clearCache();

      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('returns accurate cache statistics', () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse('key1', { name: 'Test1' }, usage);
      setCachedResponse('key2', { name: 'Test2' }, usage);

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('removes only expired entries', async () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      // Add entry with short TTL (will expire)
      setCachedResponse('expired-key', { name: 'Expired' }, usage, 1);

      // Add entry with long TTL (won't expire)
      setCachedResponse('valid-key', { name: 'Valid' }, usage, 10000);

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleaned = cleanupExpiredEntries();

      expect(cleaned).toBe(1);
      expect(getCachedResponse('expired-key')).toBeNull();
      expect(getCachedResponse('valid-key')).not.toBeNull();
    });

    it('returns 0 when no entries are expired', () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        durationMs: 1000,
        units: 50,
      };

      setCachedResponse('key1', { name: 'Test1' }, usage, 10000);
      setCachedResponse('key2', { name: 'Test2' }, usage, 10000);

      const cleaned = cleanupExpiredEntries();

      expect(cleaned).toBe(0);
    });
  });
});
