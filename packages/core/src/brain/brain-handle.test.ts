import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { brainHandle } from './brain-handle';
import type { GenerateResult } from './adapters/anthropic';

// Mock dependencies
vi.mock('./adapters/anthropic', () => ({
  generateStructured: vi.fn(),
}));

vi.mock('../ledger', () => ({
  recordUsage: vi.fn(),
}));

// Import mocked functions
import { generateStructured } from './adapters/anthropic';
import { recordUsage } from '../ledger';

// Test schema
const TestSchema = z.object({
  title: z.string(),
  count: z.number(),
});

type TestOutput = z.infer<typeof TestSchema>;

describe('brainHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: recordUsage returns success
    vi.mocked(recordUsage).mockResolvedValue({
      success: true,
      data: {
        id: 'event-123',
        action: 'test:action:generate',
        tenantId: null,
        userId: null,
        moduleId: 'test',
        tokensInput: 0,
        tokensOutput: 0,
        tokensTotal: 0,
        units: 0,
        durationMs: 100,
        metadata: {},
        createdAt: new Date().toISOString(),
      },
    });
  });

  describe('Success path', () => {
    it('returns success result with typed data when adapter succeeds', async () => {
      const mockOutput: TestOutput = { title: 'Test', count: 42 };
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: mockOutput,
        usage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Generate something',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockOutput);
        expect(result.usage.promptTokens).toBe(100);
        expect(result.usage.completionTokens).toBe(200);
        expect(result.usage.totalTokens).toBe(300);
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.usage.units).toBe(50); // Known task type
      }
    });

    it('calls generateStructured with correct parameters', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System prompt here',
        userPrompt: 'User prompt here',
        schema: TestSchema,
      });

      expect(generateStructured).toHaveBeenCalledWith({
        schema: TestSchema,
        prompt: 'User prompt here',
        system: 'System prompt here',
        maxTokens: undefined,
        temperature: undefined,
      });
    });

    it('passes options to adapter when provided', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
        options: {
          maxTokens: 8000,
          temperature: 0.9,
        },
      });

      expect(generateStructured).toHaveBeenCalledWith({
        schema: TestSchema,
        prompt: 'User',
        system: 'System',
        maxTokens: 8000,
        temperature: 0.9,
      });
    });

    it('calls recordUsage with correct parameters on success', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 150, completionTokens: 250, totalTokens: 400 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith({
        action: 'agency:scope:generate',
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        tokensInput: 150,
        tokensOutput: 250,
        units: 50, // Known task type
        durationMs: expect.any(Number),
        metadata: { task: 'agency.scope' },
      });
    });
  });

  describe('Action format derivation', () => {
    it('converts "module.task" to "module:task:generate"', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'agency:scope:generate',
        })
      );
    });

    it('converts "agency.proposal" to "agency:proposal:generate"', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.proposal',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'agency:proposal:generate',
        })
      );
    });
  });

  describe('Brain Units calculation', () => {
    it('uses fixed cost for known task type "agency.scope"', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 1000, completionTokens: 2000, totalTokens: 3000 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.units).toBe(50); // Fixed cost, not token-based
      }
    });

    it('uses fixed cost for known task type "agency.proposal"', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 500, completionTokens: 500, totalTokens: 1000 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.proposal',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.units).toBe(100); // Fixed cost
      }
    });

    it('calculates units based on tokens for unknown task type', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 300, completionTokens: 700, totalTokens: 1000 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'custom',
        taskType: 'custom.task',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 1000 tokens / 100 = 10 units
        expect(result.usage.units).toBe(10);
      }
    });

    it('rounds up units for partial token amounts', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'custom',
        taskType: 'custom.task',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 250 tokens / 100 = 2.5 → ceil(2.5) = 3 units
        expect(result.usage.units).toBe(3);
      }
    });
  });

  describe('Adapter failure handling', () => {
    it('returns failure result when adapter returns success: false', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: false,
        error: 'API rate limit exceeded',
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API rate limit exceeded');
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('records usage with units: 0 and failed: true when adapter fails', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: false,
        error: 'Generation failed',
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith({
        action: 'agency:scope:generate',
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        tokensInput: 0,
        tokensOutput: 0,
        units: 0,
        durationMs: expect.any(Number),
        metadata: {
          task: 'agency.scope',
          failed: true,
          error: 'Generation failed',
        },
      });
    });
  });

  describe('Unexpected error handling', () => {
    it('returns failure result when adapter throws Error', async () => {
      vi.mocked(generateStructured).mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network connection failed');
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns failure result when adapter throws non-Error', async () => {
      vi.mocked(generateStructured).mockRejectedValue('Something went wrong');

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown error');
      }
    });

    it('records usage with units: 0 and failed: true when adapter throws', async () => {
      vi.mocked(generateStructured).mockRejectedValue(
        new Error('Unexpected failure')
      );

      await brainHandle({
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith({
        action: 'agency:scope:generate',
        tenantId: 'tenant-123',
        userId: 'user-456',
        moduleId: 'agency',
        tokensInput: 0,
        tokensOutput: 0,
        units: 0,
        durationMs: expect.any(Number),
        metadata: {
          task: 'agency.scope',
          failed: true,
          error: 'Unexpected failure',
        },
      });
    });

    it('handles recordUsage failure silently when adapter throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(generateStructured).mockRejectedValue(
        new Error('Adapter error')
      );
      // recordUsage returns error result (doesn't throw)
      vi.mocked(recordUsage).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      // brainHandle should still return failure result
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Adapter error');
      }

      // Should log the recordUsage error string
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[brainHandle] Failed to record usage:',
        'Database connection failed'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Invalid taskType format', () => {
    it('returns failure for taskType without dot', async () => {
      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'invalid',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format');
        expect(result.error).toContain('invalid');
        expect(result.error).toContain('module.task');
      }

      // Should not call generateStructured
      expect(generateStructured).not.toHaveBeenCalled();
    });

    it('returns failure for taskType with empty module', async () => {
      const result = await brainHandle({
        moduleId: 'agency',
        taskType: '.task',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format');
      }

      expect(generateStructured).not.toHaveBeenCalled();
    });

    it('returns failure for taskType with empty task', async () => {
      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'module.',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format');
      }

      expect(generateStructured).not.toHaveBeenCalled();
    });

    it('returns failure for taskType with too many dots', async () => {
      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'a.b.c',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid taskType format');
      }

      expect(generateStructured).not.toHaveBeenCalled();
    });

    it('includes durationMs in failure result for invalid taskType', async () => {
      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'invalid',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Optional parameters', () => {
    it('handles missing tenantId and userId', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
        // tenantId and userId omitted
      });

      expect(result.success).toBe(true);

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: undefined,
          userId: undefined,
        })
      );
    });

    it('handles null tenantId', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      await brainHandle({
        tenantId: null,
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: null,
        })
      );
    });
  });

  describe('Duration tracking', () => {
    it('tracks duration for successful operations', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: true,
        object: { title: 'Test', count: 42 },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      );
    });

    it('tracks duration for failed operations', async () => {
      const mockResult: GenerateResult<TestOutput> = {
        success: false,
        error: 'Failed',
      };

      vi.mocked(generateStructured).mockResolvedValue(mockResult);

      const result = await brainHandle({
        moduleId: 'agency',
        taskType: 'agency.scope',
        systemPrompt: 'System',
        userPrompt: 'User',
        schema: TestSchema,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.usage.durationMs).toBeGreaterThanOrEqual(0);
      }

      expect(recordUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      );
    });
  });
});
