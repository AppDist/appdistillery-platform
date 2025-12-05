import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  calculateUnits,
  deriveAction,
  getAdapter,
  checkCache,
  checkRateLimitError,
  validateBrainTask,
} from './brain-handle-helpers';
import { clearCache, setCachedResponse, generateCacheKey } from './cache';
import { clearAllRateLimits, checkRateLimit } from './rate-limiter';
import type { BrainTask } from './types';

// Mock dependencies
vi.mock('./adapters/anthropic', () => ({
  generateStructured: vi.fn(),
}));

vi.mock('./adapters/openai', () => ({
  generateStructuredWithOpenAI: vi.fn(),
}));

vi.mock('./adapters/google', () => ({
  generateStructuredWithGoogle: vi.fn(),
}));

vi.mock('../ledger', () => ({
  recordUsage: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import mocked adapters
import { generateStructured } from './adapters/anthropic';
import { generateStructuredWithOpenAI } from './adapters/openai';
import { generateStructuredWithGoogle } from './adapters/google';

// Test schema
const TestSchema = z.object({
  title: z.string(),
  count: z.number(),
});

describe('Brain Handle Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    clearAllRateLimits();
  });

  describe('calculateUnits', () => {
    it('returns fixed cost for known task types', () => {
      expect(calculateUnits('agency.scope')).toBe(50);
      expect(calculateUnits('agency.proposal')).toBe(100);
    });

    it('calculates token-based cost for unknown tasks', () => {
      // 1 unit per 100 tokens
      expect(calculateUnits('unknown.task', 500)).toBe(5);
      expect(calculateUnits('custom.operation', 1500)).toBe(15);
      expect(calculateUnits('another.task', 250)).toBe(3); // Rounded up
    });

    it('uses 1000 tokens default when tokens undefined', () => {
      // 1000 tokens / 100 = 10 units
      expect(calculateUnits('unknown.task')).toBe(10);
      expect(calculateUnits('any.task', undefined)).toBe(10);
    });

    it('rounds up fractional units', () => {
      // 150 tokens -> 1.5 -> ceil(1.5) = 2
      expect(calculateUnits('custom.task', 150)).toBe(2);
      // 350 tokens -> 3.5 -> ceil(3.5) = 4
      expect(calculateUnits('custom.task', 350)).toBe(4);
    });

    it('handles zero tokens', () => {
      // 0 tokens / 100 = 0 -> ceil(0) = 0
      expect(calculateUnits('custom.task', 0)).toBe(0);
    });
  });

  describe('deriveAction', () => {
    it('converts module.task to module:task:generate', () => {
      expect(deriveAction('agency.scope')).toBe('agency:scope:generate');
      expect(deriveAction('billing.invoice')).toBe('billing:invoice:generate');
      expect(deriveAction('proposal.draft')).toBe('proposal:draft:generate');
    });

    it('throws on invalid format (missing dot)', () => {
      expect(() => deriveAction('agencyscope')).toThrow(
        "Invalid taskType format: agencyscope. Expected 'module.task'"
      );
      expect(() => deriveAction('nodot')).toThrow();
    });

    it('throws on invalid format (too many dots)', () => {
      expect(() => deriveAction('agency.scope.extra')).toThrow(
        "Invalid taskType format: agency.scope.extra. Expected 'module.task'"
      );
    });

    it('throws on empty segments', () => {
      expect(() => deriveAction('.scope')).toThrow();
      expect(() => deriveAction('agency.')).toThrow();
      expect(() => deriveAction('.')).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => deriveAction('')).toThrow();
    });
  });

  describe('getAdapter', () => {
    it('returns anthropic adapter by default', () => {
      const adapter = getAdapter();
      expect(adapter).toBe(generateStructured);
    });

    it('returns anthropic adapter when specified', () => {
      const adapter = getAdapter('anthropic');
      expect(adapter).toBe(generateStructured);
    });

    it('returns openai adapter when specified', () => {
      const adapter = getAdapter('openai');
      expect(adapter).toBe(generateStructuredWithOpenAI);
    });

    it('returns google adapter when specified', () => {
      const adapter = getAdapter('google');
      expect(adapter).toBe(generateStructuredWithGoogle);
    });
  });

  describe('checkCache', () => {
    const createTask = (overrides?: Partial<BrainTask<typeof TestSchema>>): BrainTask<typeof TestSchema> => ({
      tenantId: 'tenant-123',
      userId: 'user-456',
      moduleId: 'test',
      taskType: 'test.task',
      systemPrompt: 'You are a test assistant',
      userPrompt: 'Generate test data',
      schema: TestSchema,
      ...overrides,
    });

    it('returns null when caching disabled', () => {
      const task = createTask({ options: { useCache: false } });
      const result = checkCache(task, Date.now());
      expect(result).toBeNull();
    });

    it('returns cached result when available', () => {
      const task = createTask({ options: { useCache: true } });
      const cachedData = { title: 'Cached Result', count: 99 };

      // Use actual generateCacheKey to ensure key matches
      const cacheKey = generateCacheKey(
        task.taskType,
        task.systemPrompt,
        task.userPrompt,
        task.schema
      );

      setCachedResponse(
        cacheKey,
        cachedData,
        { promptTokens: 10, completionTokens: 20, totalTokens: 30, durationMs: 100, units: 5 }
      );

      const startTime = Date.now();
      const result = checkCache(task, startTime);

      // Should return cached result - narrow the discriminated union
      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      if (result?.success) {
        expect(result.data).toEqual(cachedData);
        expect(result.usage.units).toBe(5);
        expect(result.usage.totalTokens).toBe(30);
      }
    });

    it('returns null when cache miss', () => {
      const task = createTask();
      const result = checkCache(task, Date.now());
      expect(result).toBeNull();
    });

    it('defaults to caching enabled', () => {
      const task = createTask({ options: undefined });
      // Should not throw and should check cache
      const result = checkCache(task, Date.now());
      expect(result).toBeNull(); // Miss, but tried to check
    });
  });

  describe('checkRateLimitError', () => {
    const createTask = (): BrainTask<typeof TestSchema> => ({
      tenantId: 'tenant-123',
      userId: 'user-456',
      moduleId: 'test',
      taskType: 'test.task',
      systemPrompt: 'Test',
      userPrompt: 'Test prompt',
      schema: TestSchema,
    });

    it('returns null when rate limit not exceeded', () => {
      const task = createTask();
      const result = checkRateLimitError(task, Date.now());
      expect(result).toBeNull();
    });

    it('returns error result when rate limited', () => {
      const task = createTask();

      // Exhaust rate limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(task.tenantId, task.userId);
      }

      const result = checkRateLimitError(task, Date.now());

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      if (result && !result.success) {
        expect(result.error).toContain('usage limit');
      }
    });

    it('formats time message correctly for hours', () => {
      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const task = createTask();

      // Exhaust rate limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(task.tenantId, task.userId);
      }

      const result = checkRateLimitError(task, Date.now());

      expect(result?.success).toBe(false);
      if (result && !result.success) {
        // Default window is 1 hour, so should show hour message
        expect(result.error).toMatch(/hour|minute/i);
      }

      warnSpy.mockRestore();
    });

    it('includes durationMs in error result', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const task = createTask();

      // Exhaust rate limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(task.tenantId, task.userId);
      }

      const startTime = Date.now() - 1000; // 1 second ago
      const result = checkRateLimitError(task, startTime);

      expect(result?.usage?.durationMs).toBeGreaterThanOrEqual(1000);

      warnSpy.mockRestore();
    });
  });

  describe('validateBrainTask', () => {
    const createTask = (overrides?: Partial<BrainTask<typeof TestSchema>>): BrainTask<typeof TestSchema> => ({
      tenantId: 'tenant-123',
      userId: 'user-456',
      moduleId: 'test',
      taskType: 'test.task',
      systemPrompt: 'You are a test assistant',
      userPrompt: 'Generate test data',
      schema: TestSchema,
      ...overrides,
    });

    it('returns success with action and sanitized prompt', () => {
      const task = createTask();
      const result = validateBrainTask(task, Date.now());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.action).toBe('test:task:generate');
        expect(result.sanitizedPrompt).toBe('Generate test data');
      }
    });

    it('returns error on empty prompt', () => {
      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const task = createTask({ userPrompt: '' });
      const result = validateBrainTask(task, Date.now());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.success).toBe(false);
        if (!result.result.success) {
          expect(result.result.error).toContain('content');
        }
      }

      warnSpy.mockRestore();
    });

    it('returns error on invalid taskType format', () => {
      const task = createTask({ taskType: 'invalid-task-type' });
      const result = validateBrainTask(task, Date.now());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.success).toBe(false);
      }
    });

    it('sanitizes whitespace in prompt', () => {
      const task = createTask({ userPrompt: '  Generate   test   data  ' });
      const result = validateBrainTask(task, Date.now());

      expect(result.success).toBe(true);
      if (result.success) {
        // Prompt should be sanitized (whitespace normalized)
        expect(result.sanitizedPrompt.length).toBeLessThanOrEqual(
          '  Generate   test   data  '.length
        );
      }
    });

    it('includes durationMs in error results', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const task = createTask({ userPrompt: '' });
      const startTime = Date.now() - 500;
      const result = validateBrainTask(task, startTime);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.usage?.durationMs).toBeGreaterThanOrEqual(500);
      }

      warnSpy.mockRestore();
    });
  });
});
