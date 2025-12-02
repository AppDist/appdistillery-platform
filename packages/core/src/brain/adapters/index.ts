/**
 * AI Adapters for Brain module
 *
 * This module provides adapters for different AI providers using Vercel AI SDK.
 * All adapters provide structured output generation with Zod schemas.
 */

// Anthropic adapter
export {
  generateStructured,
  ANTHROPIC_MODELS,
  type GenerateOptions,
  type GenerateResult,
  type AnthropicModel,
} from './anthropic';

// OpenAI adapter
export {
  generateStructuredWithOpenAI,
  OPENAI_MODELS,
  type GenerateOptionsWithOpenAI,
  type OpenAIModel,
} from './openai';

// Google Gemini adapter
export {
  generateStructuredWithGoogle,
  GOOGLE_MODELS,
  type GenerateOptionsWithGoogle,
  type GoogleModel,
} from './google';
