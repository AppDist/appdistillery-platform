import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  type GenerateResult,
  extractUsage,
  withTimeout,
  createClientCache,
  DEFAULT_RETRY_CONFIG,
  sleep,
  isRetryableError,
  sanitizeErrorMessage,
} from './shared'

/**
 * Anthropic adapter using Vercel AI SDK
 *
 * Provides structured output generation using Claude models with
 * automatic retry logic and token counting.
 */

// Default model configuration
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929' // Latest Claude 4.5 Sonnet
const DEFAULT_MAX_TOKENS = 4000
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_TIMEOUT_MS = 60000 // 60 seconds

/**
 * Options for generateStructured function
 */
export interface GenerateOptions<T extends z.ZodType> {
  schema: T
  prompt: string
  system?: string
  model?: string
  maxOutputTokens?: number
  temperature?: number
  timeoutMs?: number
}

// Re-export GenerateResult for external use
export type { GenerateResult }

/**
 * Get or create Anthropic client with API key from environment
 *
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws {Error} If ANTHROPIC_API_KEY is not set
 */
const getAnthropicClient = createClientCache({
  envVarName: 'ANTHROPIC_API_KEY',
  createClient: (apiKey) => createAnthropic({ apiKey }),
  adapterName: 'anthropic',
})

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
    maxOutputTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options

  // Initialize Anthropic client (singleton)
  let anthropic: ReturnType<typeof createAnthropic>
  try {
    anthropic = getAnthropicClient()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Anthropic client',
    }
  }

  const { maxRetries, initialDelayMs, maxDelayMs } = DEFAULT_RETRY_CONFIG

  // Retry loop with exponential backoff
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wrap AI call with timeout using shared utility
      const result = await withTimeout(async (signal) => {
        // Type assertion needed for v5 overload resolution
        return await generateObject({
          model: anthropic(model),
          schema,
          prompt,
          system,
          maxOutputTokens,
          temperature,
          abortSignal: signal,
        } as any)
      }, timeoutMs)

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
    error: lastError ? sanitizeErrorMessage(lastError, 'generateStructured') : 'Unknown error occurred',
  }
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
