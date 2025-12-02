import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * OpenAI adapter using Vercel AI SDK
 *
 * Provides structured output generation using OpenAI models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'gpt-5-mini';  // GPT-5 Mini - General tasks, balanced
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.7;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;  // 10 second ceiling

/**
 * Options for generateStructuredWithOpenAI function
 */
export interface GenerateOptionsWithOpenAI<T extends z.ZodType> {
  schema: T;
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Result of generateStructuredWithOpenAI function using discriminated union
 */
export type GenerateResult<T> =
  | {
      success: true;
      object: T;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Cached OpenAI client instance
 */
let cachedClient: ReturnType<typeof createOpenAI> | null = null;

/**
 * Get or create OpenAI client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If OPENAI_API_KEY is not set
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required. ' +
      'Add it to your .env.local file.'
    );
  }

  if (!cachedClient) {
    cachedClient = createOpenAI({ apiKey });
  }

  return cachedClient;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (rate limit, timeout, or temporary server error)
 *
 * Prioritizes error status codes when available, falls back to message matching.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Check for HTTP status code if available
  if ('status' in error) {
    const status = (error as any).status;
    if ([429, 502, 503, 504].includes(status)) return true;
  }

  // Fallback to case-insensitive message matching
  const msg = error.message.toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('temporarily unavailable')
  );
}

/**
 * Sanitize error message for client consumption
 *
 * Logs full error details server-side, returns generic message to client.
 */
function sanitizeErrorMessage(error: Error): string {
  // Log full error internally for debugging
  console.error('[generateStructuredWithOpenAI] Error:', error.message);

  // Return generic message based on error type
  const msg = error.message.toLowerCase();
  if (msg.includes('rate limit')) return 'Rate limit exceeded. Please try again later.';
  if (msg.includes('timeout')) return 'Request timed out. Please try again.';
  if (msg.includes('api')) return 'API error occurred.';

  return 'Generation failed. Please try again.';
}

/**
 * Generate structured output using OpenAI with Vercel AI SDK
 *
 * Features:
 * - Zod schema validation for structured output
 * - Automatic retry with exponential backoff
 * - Token counting from response
 * - Type-safe output
 *
 * @example
 * ```typescript
 * const result = await generateStructuredWithOpenAI({
 *   schema: z.object({
 *     summary: z.string().describe('Brief summary'),
 *     items: z.array(z.string()),
 *   }),
 *   prompt: 'Analyze this text: ...',
 *   system: 'You are a helpful analyst',
 * });
 *
 * if (result.success) {
 *   console.log(result.object.summary);
 *   console.log(`Used ${result.usage.totalTokens} tokens`);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function generateStructuredWithOpenAI<T extends z.ZodType>(
  options: GenerateOptionsWithOpenAI<T>
): Promise<GenerateResult<z.infer<T>>> {
  const {
    schema,
    prompt,
    system,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  // Initialize OpenAI client (singleton)
  let openai: ReturnType<typeof createOpenAI>;
  try {
    openai = getOpenAIClient();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create OpenAI client',
    };
  }

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await generateObject({
        model: openai(model),
        schema,
        prompt,
        system,
        maxTokens,
        temperature,
      });

      // Extract usage information
      const usage = result.usage;
      const promptTokens = usage?.promptTokens ?? 0;
      const completionTokens = usage?.completionTokens ?? 0;
      const totalTokens = usage?.totalTokens ?? promptTokens + completionTokens;

      return {
        success: true,
        object: result.object,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Check if error is retryable using improved detection
      if (!isRetryableError(error) || attempt === MAX_RETRIES - 1) {
        break;
      }

      // Calculate delay with exponential backoff and ceiling
      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
        MAX_RETRY_DELAY_MS
      );
      await sleep(delay);
    }
  }

  // All retries failed - sanitize error message
  return {
    success: false,
    error: lastError ? sanitizeErrorMessage(lastError) : 'Unknown error occurred',
  };
}

/**
 * Get available OpenAI models
 */
export const OPENAI_MODELS = {
  // GPT-5 Family (Current - 2025)
  GPT_5_1: 'gpt-5.1',           // Frontier reasoning, complex tasks
  GPT_5_MINI: 'gpt-5-mini',     // General tasks, balanced (DEFAULT)
  GPT_5_NANO: 'gpt-5-nano',     // Simple extraction, high-volume

  // GPT-4.1 Family (Previous)
  GPT_4_1: 'gpt-4.1',           // 1M context
  GPT_4_1_MINI: 'gpt-4.1-mini', // 128K context

  // Reasoning Models (o-series)
  O3: 'o3',                      // Mathematical reasoning
  O3_MINI: 'o3-mini',            // Lightweight reasoning
} as const;

export type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
