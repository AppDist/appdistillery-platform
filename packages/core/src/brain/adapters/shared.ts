/**
 * Shared utilities for AI provider adapters
 *
 * Centralizes common functionality across Anthropic, OpenAI, and Google adapters
 * to reduce code duplication and improve maintainability.
 */

/**
 * Result type for generateStructured functions using discriminated union
 */
export type GenerateResult<T> =
  | {
      success: true
      object: T
      usage: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
      }
    }
  | {
      success: false
      error: string
    }

/**
 * Standard usage object returned by all adapters
 */
export interface StandardUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Sleep utility for retry delays
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable (rate limit, timeout, or temporary server error)
 *
 * Prioritizes error status codes when available, falls back to message matching.
 *
 * @param error - Error to check
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  // Check for HTTP status code if available
  if ('status' in error) {
    const status = (error as Error & { status?: number }).status
    if (status && [429, 502, 503, 504].includes(status)) return true
  }

  // Fallback to case-insensitive message matching
  const msg = error.message.toLowerCase()
  return (
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('temporarily unavailable')
  )
}

/**
 * Sanitize error message for client consumption
 *
 * Logs full error details server-side, returns generic message to client.
 *
 * @param error - Error to sanitize
 * @param adapterName - Name of the adapter for logging
 * @returns Sanitized error message safe for client
 */
export function sanitizeErrorMessage(error: Error, adapterName: string): string {
  // Log full error internally for debugging
  console.error(`[${adapterName}] Error:`, error.message)

  // Return generic message based on error type
  const msg = error.message.toLowerCase()
  if (msg.includes('rate limit')) return 'Rate limit exceeded. Please try again later.'
  if (msg.includes('timeout') || msg.includes('timed out')) return 'Request timed out. Please try again.'
  if (msg.includes('api')) return 'API error occurred.'

  return 'Generation failed. Please try again.'
}

/**
 * Extract standardized usage from AI SDK response
 *
 * Handles both v4 (promptTokens/completionTokens) and v5 (inputTokens/outputTokens)
 * property names for backward compatibility.
 *
 * @param usage - Usage object from AI SDK response
 * @returns Standardized usage with consistent property names
 */
export function extractUsage(usage: unknown): StandardUsage {
  const u = usage as Record<string, number | undefined>
  const promptTokens = u?.inputTokens ?? u?.promptTokens ?? 0
  const completionTokens = u?.outputTokens ?? u?.completionTokens ?? 0
  const totalTokens = u?.totalTokens ?? promptTokens + completionTokens

  return { promptTokens, completionTokens, totalTokens }
}

/**
 * Execute an operation with exponential backoff retry
 *
 * @param operation - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the operation or error message
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: {
    maxRetries: number
    initialDelayMs: number
    maxDelayMs: number
    adapterName: string
  }
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const { maxRetries, initialDelayMs, maxDelayMs, adapterName } = config
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Check if error is retryable using improved detection
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
    error: lastError ? sanitizeErrorMessage(lastError, adapterName) : 'Unknown error occurred',
  }
}

/**
 * Execute an operation with a timeout using AbortController
 *
 * @param operation - Async function that accepts an AbortSignal
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects with 'Request timed out' on timeout
 */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await operation(controller.signal)
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)

    // Convert abort error to timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }

    throw error
  }
}

/**
 * Configuration for a singleton client cache
 */
export interface ClientCacheConfig<TClient> {
  envVarName: string
  createClient: (apiKey: string) => TClient
  adapterName: string
}

/**
 * Create a singleton client manager for an AI provider
 *
 * Returns getter function that creates client on first access and caches it.
 *
 * @param config - Client cache configuration
 * @returns Getter function that returns cached client or creates new one
 */
export function createClientCache<TClient>(
  config: ClientCacheConfig<TClient>
): () => TClient {
  const { envVarName, createClient, adapterName } = config
  let cachedClient: TClient | null = null

  return () => {
    const apiKey = process.env[envVarName]

    if (!apiKey) {
      throw new Error(
        `${envVarName} environment variable is required. ` +
          `Add it to your .env.local file.`
      )
    }

    if (!cachedClient) {
      cachedClient = createClient(apiKey)
    }

    return cachedClient
  }
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000, // 10 second ceiling
} as const
