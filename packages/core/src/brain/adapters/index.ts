/**
 * AI Adapters for Brain module
 *
 * This module provides adapters for different AI providers using Vercel AI SDK.
 * All adapters provide structured output generation with Zod schemas.
 */

export {
  generateStructured,
  ANTHROPIC_MODELS,
  type GenerateOptions,
  type GenerateResult,
  type AnthropicModel,
} from './anthropic';
