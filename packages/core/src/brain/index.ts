/**
 * Brain module - AI orchestration for AppDistillery
 *
 * The brainHandle() function is the central entry point for ALL AI operations.
 * It handles:
 * - Structured output generation via Zod schemas
 * - Automatic usage recording to the ledger
 * - Provider abstraction (Anthropic default)
 * - Type-safe error handling via discriminated unions
 *
 * For streaming support, use brainHandleStream() to get progressive updates.
 *
 * @example
 * ```typescript
 * import { brainHandle } from '@appdistillery/core/brain';
 * import { ScopeResultSchema } from '../schemas/scope';
 *
 * const result = await brainHandle({
 *   tenantId: tenant?.id,
 *   moduleId: 'agency',
 *   taskType: 'agency.scope',
 *   systemPrompt: SCOPING_SYSTEM_PROMPT,
 *   userPrompt: SCOPING_USER_TEMPLATE({ problemStatement }),
 *   schema: ScopeResultSchema,
 * });
 *
 * if (!result.success) {
 *   throw new Error(result.error);
 * }
 *
 * return result.data; // Typed as z.infer<typeof ScopeResultSchema>
 * ```
 *
 * @example Streaming
 * ```typescript
 * import { brainHandleStream } from '@appdistillery/core/brain';
 *
 * const result = await brainHandleStream({ ...taskConfig });
 *
 * if (!result.success) {
 *   throw new Error(result.error);
 * }
 *
 * for await (const chunk of result.stream) {
 *   console.log('Partial:', chunk.partial);
 *   if (chunk.done) {
 *     console.log('Final:', chunk.partial);
 *   }
 * }
 * ```
 */

// Main brain handle function
export { brainHandle } from './brain-handle';

// Streaming brain handle function
export { brainHandleStream, type StreamChunk, type StreamResult } from './brain-handle-stream';

// Types
export type { BrainTask, BrainResult } from './types';

// Prompt sanitization
export {
  validatePrompt,
  validatePromptLength,
  detectInjectionPatterns,
  sanitizePrompt,
  type PromptValidationOptions,
  type PromptValidationResult,
} from './prompt-sanitizer';

// Rate limiting
export {
  checkRateLimit,
  clearRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';

// Response caching
export {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCacheEntry,
  clearCache,
  getCacheStats,
  cleanupExpiredEntries,
} from './cache';

// Re-export adapters for direct use (advanced cases only)
export {
  generateStructured,
  ANTHROPIC_MODELS,
  type GenerateOptions,
  type GenerateResult,
  type AnthropicModel,
  generateStructuredWithOpenAI,
  OPENAI_MODELS,
  type GenerateOptionsWithOpenAI,
  type OpenAIModel,
  generateStructuredWithGoogle,
  GOOGLE_MODELS,
  type GenerateOptionsWithGoogle,
  type GoogleModel,
} from './adapters';
