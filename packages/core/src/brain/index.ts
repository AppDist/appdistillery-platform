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
 */

// Main brain handle function
export { brainHandle } from './brain-handle';

// Types
export type { BrainTask, BrainResult } from './types';

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
