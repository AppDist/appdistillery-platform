import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { generateStructured, ANTHROPIC_MODELS } from './anthropic';
import type { GenerateObjectResult } from 'ai';

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (modelId: string) => ({ modelId })),
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
      ? ({
          inputTokens: usage.promptTokens ?? 0,  // v5 uses inputTokens
          outputTokens: usage.completionTokens ?? 0,  // v5 uses outputTokens
          totalTokens: usage.totalTokens ?? 0,
        } as any)
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
    reasoning: undefined,  // v5 added reasoning property
  } as GenerateObjectResult<T>;
}

describe('Anthropic Adapter', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  describe('generateStructured', () => {
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

      const result = await generateStructured({
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

      await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: 'claude-sonnet-4-5-20250929',  // Updated to Claude 4.5
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

      await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
        model: ANTHROPIC_MODELS.HAIKU_3_5,
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: ANTHROPIC_MODELS.HAIKU_3_5,
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

      await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
        system: 'System message',
        maxOutputTokens: 1000,
        temperature: 0.5,
      });

      expect(generateObject).toHaveBeenCalledWith({
        model: expect.any(Object),
        schema: testSchema,
        prompt: 'Test prompt',
        system: 'System message',
        maxOutputTokens: 1000,
        temperature: 0.5,
      });
    });

    it('returns error when API key is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('ANTHROPIC_API_KEY');
      }
    });

    it('returns sanitized error when generation fails', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Internal API error with sensitive data'));

      const result = await generateStructured({
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

      const result = await generateStructured({
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

      const result = await generateStructured({
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

      const result = await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(3);
    });

    it('does not retry on non-retryable errors', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Invalid schema'));

      const result = await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(generateObject).toHaveBeenCalledTimes(1);
    });

    it('returns sanitized error after max retries', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('rate limit exceeded'));

      const result = await generateStructured({
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

      const result = await generateStructured({
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

      const result = await generateStructured({
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

      const result = await generateStructured({
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

      const result = await generateStructured({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.totalTokens).toBe(150);
      }
    });
  });

  describe('ANTHROPIC_MODELS', () => {
    it('includes all Claude model versions', () => {
      expect(ANTHROPIC_MODELS.SONNET_4_5).toBe('claude-sonnet-4-5-20250929');
      expect(ANTHROPIC_MODELS.HAIKU_4_5).toBe('claude-haiku-4-5-20250929');
      expect(ANTHROPIC_MODELS.SONNET_4).toBe('claude-sonnet-4-20250514');
      expect(ANTHROPIC_MODELS.SONNET_3_5).toBe('claude-3-5-sonnet-20241022');
      expect(ANTHROPIC_MODELS.HAIKU_3_5).toBe('claude-3-5-haiku-20241022');
      expect(ANTHROPIC_MODELS.OPUS_3).toBe('claude-3-opus-20240229');
      expect(ANTHROPIC_MODELS.SONNET_3).toBe('claude-3-sonnet-20240229');
      expect(ANTHROPIC_MODELS.HAIKU_3).toBe('claude-3-haiku-20240307');
    });
  });
});
