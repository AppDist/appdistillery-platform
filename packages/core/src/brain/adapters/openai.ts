import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  type GenerateResult,
  extractUsage,
  sleep,
  isRetryableError,
  sanitizeErrorMessage,
  DEFAULT_RETRY_CONFIG,
} from './shared'

/**
 * OpenAI adapter using Vercel AI SDK
 *
 * Provides structured output generation using OpenAI models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'gpt-5-mini' // GPT-5 Mini - General tasks, balanced
const DEFAULT_MAX_TOKENS = 4000
const DEFAULT_TEMPERATURE = 0.7

/**
 * Options for generateStructuredWithOpenAI function
 */
export interface GenerateOptionsWithOpenAI<T extends z.ZodType> {
  schema: T
  prompt: string
  system?: string
  model?: string
  maxOutputTokens?: number
  temperature?: number
}

// Re-export GenerateResult for external use
export type { GenerateResult }

/**
 * Cached OpenAI client instance
 */
let cachedClient: ReturnType<typeof createOpenAI> | null = null

/**
 * Get or create OpenAI client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If OPENAI_API_KEY is not set
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required. ' +
        'Add it to your .env.local file.'
    )
  }

  if (!cachedClient) {
    cachedClient = createOpenAI({ apiKey })
  }

  return cachedClient
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
    maxOutputTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options

  // Initialize OpenAI client (singleton)
  let openai: ReturnType<typeof createOpenAI>
  try {
    openai = getOpenAIClient()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create OpenAI client',
    }
  }

  const { maxRetries, initialDelayMs, maxDelayMs } = DEFAULT_RETRY_CONFIG

  // Retry loop with exponential backoff
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Type assertion needed for v5 overload resolution
      const result = await generateObject({
        model: openai(model),
        schema,
        prompt,
        system,
        maxOutputTokens,
        temperature,
      } as any)

      // Extract usage information using shared utility
      const usage = extractUsage(result.usage)

      return {
        success: true,
        object: result.object,
        usage,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Check if error is retryable using shared detection
      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        break
      }

      // Calculate delay with exponential backoff and ceiling
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs)
      await sleep(delay)
    }
  }

  // All retries failed - sanitize error message
  return {
    success: false,
    error: lastError
      ? sanitizeErrorMessage(lastError, 'generateStructuredWithOpenAI')
      : 'Unknown error occurred',
  }
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
