/**
 * Shared utilities for AI provider adapters
 *
 * Centralizes common functionality across Anthropic, OpenAI, and Google adapters
 * to reduce code duplication and improve maintainability.
 */

import { logger } from '../../utils/logger';

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
 * Logs full error details server-side, returns user-friendly message to client.
 * Technical details are preserved in console logs for debugging.
 *
 * @param error - Error to sanitize
 * @param adapterName - Name of the adapter for logging
 * @returns User-friendly error message safe for client
 */
export function sanitizeErrorMessage(error: Error, adapterName: string): string {
  // Log full technical error internally for debugging
  logger.error(adapterName, 'Error', { message: error.message });

  // Return user-friendly message based on error type
  const msg = error.message.toLowerCase()

  // Rate limiting - User-friendly with actionable guidance
  if (msg.includes('rate limit') || msg.includes('429')) {
    // Extract retry time if available (e.g., "Try again in 30 seconds")
    const retryMatch = msg.match(/(\d+)\s*(second|minute|hour)/i)
    if (retryMatch && retryMatch[1] && retryMatch[2]) {
      const time = retryMatch[1]
      const unit = retryMatch[2]
      return `You've reached the usage limit. Please wait ${time} ${unit}${parseInt(time) > 1 ? 's' : ''} before trying again.`
    }
    return 'You\'ve reached the usage limit. Please wait a moment before trying again.'
  }

  // Timeouts - Clear and actionable
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) {
    return 'The request took too long. Please try with a shorter prompt.'
  }

  // API key / Configuration errors - Hide technical details
  if (msg.includes('api key') || msg.includes('api_key') || msg.includes('environment variable') || msg.includes('unauthorized') || msg.includes('401')) {
    return 'AI service temporarily unavailable. Please try again later.'
  }

  // Network / Connection errors - User-actionable
  if (msg.includes('network') || msg.includes('connection') || msg.includes('econnrefused') || msg.includes('fetch failed')) {
    return 'Unable to connect to the AI service. Please check your connection and try again.'
  }

  // Server errors (5xx)
  if (msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('server error') || msg.includes('service unavailable')) {
    return 'AI service temporarily unavailable. Please try again in a few moments.'
  }

  // Generic API errors
  if (msg.includes('api') || msg.includes('request failed')) {
    return 'Unable to complete your request. Please try again later.'
  }

  // Content/Safety errors - Friendlier guidance
  if (msg.includes('content') && (msg.includes('policy') || msg.includes('filter') || msg.includes('blocked'))) {
    return 'Unable to process this request. Please try rephrasing your prompt.'
  }

  // Generic fallback
  return 'Unable to complete your request. Please try again later.'
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
