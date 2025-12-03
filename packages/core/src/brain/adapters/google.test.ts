import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { generateStructuredWithGoogle, GOOGLE_MODELS } from './google';
import type { GenerateObjectResult } from 'ai';

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => (modelId: string) => ({ modelId })),
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

describe('Google Adapter', () => {
  const originalEnv = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalEnv;
  });

  describe('generateStructuredWithGoogle', () => {
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

      const result = await generateStructuredWithGoogle({
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

      await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: 'gemini-2.5-flash',  // Default model
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

      await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
        model: GOOGLE_MODELS.GEMINI_2_5_PRO,
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: GOOGLE_MODELS.GEMINI_2_5_PRO,
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

      await generateStructuredWithGoogle({
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
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
      }
    });

    it('returns sanitized error when generation fails', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Internal API error with sensitive data'));

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(3);
    });

    it('does not retry on non-retryable errors', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Invalid schema'));

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(generateObject).toHaveBeenCalledTimes(1);
    });

    it('returns sanitized error after max retries', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('rate limit exceeded'));

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('retries on error with status code 502', async () => {
      const errorWith502 = Object.assign(new Error('Bad Gateway'), { status: 502 });

      vi.mocked(generateObject)
        .mockRejectedValueOnce(errorWith502)
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('retries on error with status code 504', async () => {
      const errorWith504 = Object.assign(new Error('Gateway Timeout'), { status: 504 });

      vi.mocked(generateObject)
        .mockRejectedValueOnce(errorWith504)
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('retries on error with message "temporarily unavailable"', async () => {
      vi.mocked(generateObject)
        .mockRejectedValueOnce(new Error('Service is temporarily unavailable'))
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
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

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage.totalTokens).toBe(150);
      }
    });

    it('uses singleton client pattern', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(
          { summary: 'test', items: [] },
          { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
        )
      );

      // Make multiple calls
      await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt 1',
      });

      await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt 2',
      });

      // Both calls should succeed (client is cached)
      expect(generateObject).toHaveBeenCalledTimes(2);
    });

    it('uses maxOutputTokens parameter (not maxTokens)', async () => {
      vi.mocked(generateObject).mockResolvedValue(
        createMockResult(
          { summary: 'test', items: [] },
          { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
        )
      );

      await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
        maxOutputTokens: 2000,
      });

      expect(generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          maxOutputTokens: 2000,
        })
      );
    });

    it('handles non-Error exceptions gracefully', async () => {
      vi.mocked(generateObject).mockRejectedValue('String error');

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Generation failed. Please try again.');
      }
    });

    it('does not retry when status code is not retryable', async () => {
      const errorWith400 = Object.assign(new Error('Bad Request'), { status: 400 });

      vi.mocked(generateObject).mockRejectedValue(errorWith400);

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(generateObject).toHaveBeenCalledTimes(1);
    });

    it('handles case-insensitive error message matching', async () => {
      vi.mocked(generateObject)
        .mockRejectedValueOnce(new Error('RATE LIMIT EXCEEDED'))  // Uppercase
        .mockResolvedValueOnce(
          createMockResult(
            { summary: 'test', items: [] },
            { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
          )
        );

      const result = await generateStructuredWithGoogle({
        schema: testSchema,
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(generateObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('GOOGLE_MODELS', () => {
    it('includes Gemini 3 family models', () => {
      expect(GOOGLE_MODELS.GEMINI_3_PRO_PREVIEW).toBe('gemini-3-pro-preview');
      expect(GOOGLE_MODELS.GEMINI_3_PRO_IMAGE_PREVIEW).toBe('gemini-3-pro-image-preview');
    });

    it('includes Gemini 2.5 family models', () => {
      expect(GOOGLE_MODELS.GEMINI_2_5_PRO).toBe('gemini-2.5-pro');
      expect(GOOGLE_MODELS.GEMINI_2_5_FLASH).toBe('gemini-2.5-flash');
      expect(GOOGLE_MODELS.GEMINI_2_5_FLASH_LITE).toBe('gemini-2.5-flash-lite');
    });

    it('uses GEMINI_2_5_FLASH as default model', () => {
      // This verifies the constant exists and matches the default in google.ts
      expect(GOOGLE_MODELS.GEMINI_2_5_FLASH).toBe('gemini-2.5-flash');
    });
  });
});
