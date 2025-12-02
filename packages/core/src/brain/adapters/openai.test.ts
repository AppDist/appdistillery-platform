import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { generateStructuredWithOpenAI, OPENAI_MODELS } from './openai';
import type { GenerateObjectResult } from 'ai';

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => (modelId: string) => ({ modelId })),
}));

import { generateObject } from 'ai';

// Helper to create minimal mock response
function createMockResult<T>(
  object: T,
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }
): GenerateObjectResult<T> {
  return {
    object,
    usage: usage
      ? {
          promptTokens: usage.promptTokens ?? 0,
          completionTokens: usage.completionTokens ?? 0,
          totalTokens: usage.totalTokens ?? 0,
        }
      : undefined,
    finishReason: 'stop',
    response: {} as any,
    warnings: undefined,
    request: {} as any,
    logprobs: undefined,
    providerMetadata: undefined,
    rawResponse: undefined,
    experimental_providerMetadata: undefined,
    toJsonResponse: () => ({} as any),
  } as GenerateObjectResult<T>;
}

describe('OpenAI Adapter', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });

  describe('generateStructuredWithOpenAI', () => {
    const testSchema = z.object({
      summary: z.string().describe('Brief summary'),
      items: z.array(z.string()).describe('List of items'),
    });

    it('generates structured output successfully', async () => {
      const mockOutput = {
        summary: 'Test summary',
        items: ['item1', 'item2'],
      };

      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(mockOutput, {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        })
      );

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
        system: 'You are helpful',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.object).toEqual(mockOutput);
        expect(result.usage.totalTokens).toBe(150);
        expect(result.usage.promptTokens).toBe(100);
        expect(result.usage.completionTokens).toBe(50);
      }
    });

    it('uses default model when not specified', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(
          { summary: 'test', items: [] },
          { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
        )
      );

      await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: 'gpt-5-mini',  // Default model
          }),
        })
      );
    });

    it('uses custom model when specified', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(
          { summary: 'test', items: [] },
          { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
        )
      );

      await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
        model: OPENAI_MODELS.GPT_5_1,
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: OPENAI_MODELS.GPT_5_1,
          }),
        })
      );
    });

    it('passes all options to generateObject', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(
          { summary: 'test', items: [] },
          { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
        )
      );

      await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
        system: 'System message',
        maxTokens: 1000,
        temperature: 0.5,
      });

      expect(generateObject).toHaveBeenCalledWith({
        model: expect.any(Object),
        schema: testSchema,
        prompt: 'Test prompt',
        system: 'System message',
        maxTokens: 1000,
        temperature: 0.5,
      });
    });

    it('returns error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('OPENAI_API_KEY');
      }
    });

    it('returns sanitized error when generation fails', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Internal API error with sensitive data'));

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error message should be sanitized
        expect(result.error).toBe('API error occurred.');
      }
    });

    it('returns specific sanitized error for rate limits', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('rate limit exceeded'));

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded. Please try again later.');
      }
    });

    it('returns specific sanitized error for timeouts', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Request timeout'));

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Request timed out. Please try again.');
      }
    });

    it('retries on rate limit errors', async () => {
      // First two attempts fail with rate limit
      vi.mocked(generateObject)
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(3);
    });

    it('does not retry on non-retryable errors', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Invalid schema'));

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(generateObject).toHaveBeenCalledTimes(1);
    });

    it('returns sanitized error after max retries', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('rate limit exceeded'));

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(generateObject).toHaveBeenCalledTimes(3); // MAX_RETRIES
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded. Please try again later.');
      }
    });

    it('retries on error with status code 429', async () => {
      const errorWith429 = Object.assign(new Error('Too many requests'), { status: 429 });

      // First attempt fails, second succeeds
      vi.mocked(generateObject)
        .mockRejectedValueOnce(errorWith429)
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('retries on error with status code 503', async () => {
      const errorWith503 = Object.assign(new Error('Service unavailable'), { status: 503 });

      vi.mocked(generateObject)
        .mockRejectedValueOnce(errorWith503)
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('handles missing usage information', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult({ summary: 'test', items: [] }, undefined)
      );

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.totalTokens).toBe(0);
        expect(result.usage.promptTokens).toBe(0);
        expect(result.usage.completionTokens).toBe(0);
      }
    });

    it('calculates totalTokens when not provided', async () => {
      const mockResult = createMockResult(
        { summary: 'test', items: [] },
        { promptTokens: 100, completionTokens: 50 }
      );
      // Override totalTokens to undefined to test calculation
      if (mockResult.usage) {
        (mockResult.usage as any).totalTokens = undefined;
      }

      vi.mocked(generateObject).mockResolvedValue(mockResult);

      const result = await generateStructuredWithOpenAI({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.totalTokens).toBe(150);
      }
    });
  });

  describe('OPENAI_MODELS', () => {
    it('includes all OpenAI model versions', () => {
      // GPT-5 Family
      expect(OPENAI_MODELS.GPT_5_1).toBe('gpt-5.1');
      expect(OPENAI_MODELS.GPT_5_MINI).toBe('gpt-5-mini');
      expect(OPENAI_MODELS.GPT_5_NANO).toBe('gpt-5-nano');

      // GPT-4.1 Family
      expect(OPENAI_MODELS.GPT_4_1).toBe('gpt-4.1');
      expect(OPENAI_MODELS.GPT_4_1_MINI).toBe('gpt-4.1-mini');

      // Reasoning Models
      expect(OPENAI_MODELS.O3).toBe('o3');
      expect(OPENAI_MODELS.O3_MINI).toBe('o3-mini');
    });
  });
});
