import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Anthropic adapter using Vercel AI SDK
 *
 * Provides structured output generation using Claude models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';  // Latest Claude 4.5 Sonnet
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.7;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;  // 10 second ceiling

/**
 * Options for generateStructured function
 */
export interface GenerateOptions<T extends z.ZodType> {
  schema: T;
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Result of generateStructured function using discriminated union
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
 * Cached Anthropic client instance
 */
let cachedClient: ReturnType<typeof createAnthropic> | null = null;

/**
 * Get or create Anthropic client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If ANTHROPIC_API_KEY is not set
 */
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required. ' +
      'Add it to your .env.local file.'
    );
  }

  if (!cachedClient) {
    cachedClient = createAnthropic({ apiKey });
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
  console.error('[generateStructured] Error:', error.message);

  // Return generic message based on error type
  const msg = error.message.toLowerCase();
  if (msg.includes('rate limit')) return 'Rate limit exceeded. Please try again later.';
  if (msg.includes('timeout')) return 'Request timed out. Please try again.';
  if (msg.includes('api')) return 'API error occurred.';

  return 'Generation failed. Please try again.';
}

/**
 * Generate structured output using Anthropic Claude with Vercel AI SDK
 *
 * Features:
 * - Zod schema validation for structured output
 * - Automatic retry with exponential backoff
 * - Token counting from response
 * - Type-safe output
 *
 * @example
 * ```typescript
 * const result = await generateStructured({
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
export async function generateStructured<T extends z.ZodType>(
  options: GenerateOptions<T>
): Promise<GenerateResult<z.infer<T>>> {
  const {
    schema,
    prompt,
    system,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  // Initialize Anthropic client (singleton)
  let anthropic: ReturnType<typeof createAnthropic>;
  try {
    anthropic = getAnthropicClient();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Anthropic client',
    };
  }

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await generateObject({
        model: anthropic(model),
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
 * Get available Anthropic models
 */
export const ANTHROPIC_MODELS = {
  // Claude 4.5 (Latest)
  SONNET_4_5: 'claude-sonnet-4-5-20250929',
  HAIKU_4_5: 'claude-haiku-4-5-20250929',

  // Claude 4 (Current default)
  SONNET_4: 'claude-sonnet-4-20250514',

  // Claude 3.5
  SONNET_3_5: 'claude-3-5-sonnet-20241022',
  HAIKU_3_5: 'claude-3-5-haiku-20241022',

  // Claude 3
  OPUS_3: 'claude-3-opus-20240229',
  SONNET_3: 'claude-3-sonnet-20240229',
  HAIKU_3: 'claude-3-haiku-20240307',
} as const;

export type AnthropicModel = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];
