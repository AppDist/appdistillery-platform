import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  type GenerateResult,
  extractUsage,
  createClientCache,
  DEFAULT_RETRY_CONFIG,
  sleep,
  isRetryableError,
  sanitizeErrorMessage,
} from './shared'

/**
 * Google Gemini adapter using Vercel AI SDK
 *
 * Provides structured output generation using Gemini models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'gemini-2.5-flash' // Gemini 2.5 Flash - Balanced, agentic
const DEFAULT_MAX_TOKENS = 4000
const DEFAULT_TEMPERATURE = 0.7

/**
 * Options for generateStructuredWithGoogle function
 */
export interface GenerateOptionsWithGoogle<T extends z.ZodType> {
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
 * Get or create Google Generative AI client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If GOOGLE_GENERATIVE_AI_API_KEY is not set
 */
const getGoogleClient = createClientCache({
  envVarName: 'GOOGLE_GENERATIVE_AI_API_KEY',
  createClient: (apiKey) => createGoogleGenerativeAI({ apiKey }),
  adapterName: 'google',
})

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
    maxOutputTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options

  // Initialize Google Generative AI client (singleton)
  let google: ReturnType<typeof createGoogleGenerativeAI>
  try {
    google = getGoogleClient()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Google client',
    }
  }

  const { maxRetries, initialDelayMs, maxDelayMs } = DEFAULT_RETRY_CONFIG

  // Retry loop with exponential backoff
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Type assertions needed for v5 overload resolution
      const result = await generateObject({
        model: google(model) as any,
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
      ? sanitizeErrorMessage(lastError, 'generateStructuredWithGoogle')
      : 'Unknown error occurred',
  }
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
