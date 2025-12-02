import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Google Gemini adapter using Vercel AI SDK
 *
 * Provides structured output generation using Gemini models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'gemini-2.5-flash';  // Gemini 2.5 Flash - Balanced, agentic
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.7;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;  // 10 second ceiling

/**
 * Options for generateStructuredWithGoogle function
 */
export interface GenerateOptionsWithGoogle<T extends z.ZodType> {
  schema: T;
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Result of generateStructuredWithGoogle function using discriminated union
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
 * Cached Google Generative AI client instance
 */
let cachedClient: ReturnType<typeof createGoogleGenerativeAI> | null = null;

/**
 * Get or create Google Generative AI client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If GOOGLE_GENERATIVE_AI_API_KEY is not set
 */
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY environment variable is required. ' +
      'Add it to your .env.local file.'
    );
  }

  if (!cachedClient) {
    cachedClient = createGoogleGenerativeAI({ apiKey });
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
  console.error('[generateStructuredWithGoogle] Error:', error.message);

  // Return generic message based on error type
  const msg = error.message.toLowerCase();
  if (msg.includes('rate limit')) return 'Rate limit exceeded. Please try again later.';
  if (msg.includes('timeout')) return 'Request timed out. Please try again.';
  if (msg.includes('api')) return 'API error occurred.';

  return 'Generation failed. Please try again.';
}

/**
 * Generate structured output using Google Gemini with Vercel AI SDK
 *
 * Features:
 * - Zod schema validation for structured output
 * - Automatic retry with exponential backoff
 * - Token counting from response
 * - Type-safe output
 *
 * @example
 * ```typescript
 * const result = await generateStructuredWithGoogle({
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
export async function generateStructuredWithGoogle<T extends z.ZodType>(
  options: GenerateOptionsWithGoogle<T>
): Promise<GenerateResult<z.infer<T>>> {
  const {
    schema,
    prompt,
    system,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  // Initialize Google Generative AI client (singleton)
  let google: ReturnType<typeof createGoogleGenerativeAI>;
  try {
    google = getGoogleClient();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Google client',
    };
  }

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await generateObject({
        // Type cast required: @ai-sdk/google model type doesn't exactly match
        // Vercel AI SDK's generateObject expected model interface
        model: google(model) as any,
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
 * Get available Google Gemini models
 */
export const GOOGLE_MODELS = {
  // Gemini 3 Family (Latest - February 2025)
  GEMINI_3_PRO_PREVIEW: 'gemini-3-pro-preview',           // High-level reasoning ($2.00/$12.00 per 1M)
  GEMINI_3_PRO_IMAGE_PREVIEW: 'gemini-3-pro-image-preview', // Image generation

  // Gemini 2.5 Family (Current)
  GEMINI_2_5_PRO: 'gemini-2.5-pro',           // Complex reasoning, 1M-2M context ($1.25-2.50/$10-15 per 1M)
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',       // Balanced, agentic, 1M context ($0.30/$2.50 per 1M) - DEFAULT
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite', // Cheapest text model, 1M context ($0.10/$0.40 per 1M)
} as const;

export type GoogleModel = typeof GOOGLE_MODELS[keyof typeof GOOGLE_MODELS];
