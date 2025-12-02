---
id: TASK-1-10a
title: OpenAI adapter
priority: P1-High
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-10a: OpenAI adapter

## Description

Create OpenAI AI adapter using Vercel AI SDK for structured output generation with robust error handling and token counting, matching the feature parity and patterns of the Anthropic adapter.

## Acceptance Criteria

- [x] @ai-sdk/openai installed
- [x] OpenAI model configuration with GPT-4o, GPT-4o-mini, GPT-4-turbo, o1, o1-mini
- [x] generateStructuredWithOpenAI<T>() helper for type-safe structured output
- [x] Token counting from response (prompt, completion, total)
- [x] Error handling with exponential backoff retry logic (max 10s ceiling)
- [x] Environment variable: OPENAI_API_KEY validation
- [x] Error sanitization (generic messages to clients, full details logged)
- [x] 16 comprehensive tests covering all scenarios
- [x] Feature parity with Anthropic adapter (same interfaces where applicable)

## Implementation Summary

### Files Created

1. **`packages/core/src/brain/adapters/openai.ts`** - Main adapter implementation
   - `generateStructuredWithOpenAI<T>()` - Type-safe structured output generation
   - `OPENAI_MODELS` - Model constants for all GPT versions
   - Singleton client pattern for performance (same as Anthropic)
   - Retry logic with exponential backoff (up to 10 second ceiling)
   - Error sanitization for client/server safety
   - Token counting from responses

2. **`packages/core/src/brain/adapters/index.ts`** - Updated module exports
   - Added exports: `generateStructuredWithOpenAI`, `OPENAI_MODELS`, types

3. **`packages/core/src/brain/adapters/openai.test.ts`** - Comprehensive test suite
   - 16 tests covering all functionality
   - Mock Vercel AI SDK and @ai-sdk/openai
   - Tests for success cases, error handling, retries, token counting
   - Parity testing with Anthropic adapter patterns

### Key Features

#### Type-Safe Structured Output

```typescript
import { generateStructuredWithOpenAI, OPENAI_MODELS } from '@appdistillery/core/brain/adapters';

const result = await generateStructuredWithOpenAI({
  schema: ScopeResultSchema,
  prompt: 'Analyze this lead...',
  system: 'You are a consultancy expert',
  model: OPENAI_MODELS.GPT_4O,
});

if (result.success) {
  console.log(result.object.deliverables);
  console.log(`Used ${result.usage.totalTokens} tokens`);
} else {
  console.error(result.error); // Sanitized error message
}
```

#### Model Configuration

Supports all OpenAI models:
- **Latest (GPT-4o series)**: `gpt-4o`, `gpt-4o-mini`
- **Advanced reasoning**: `o1`, `o1-mini` (new)
- **Previous generation**: `gpt-4-turbo`

Default model: `gpt-4o` (latest, most capable)

#### Retry Logic

- Max retries: 3 attempts
- Exponential backoff: 1s → 2s → 4s (with 10s ceiling)
- Retryable errors: HTTP 429, 502, 503, 504, rate limit, timeout
- Non-retryable errors: Schema validation, API errors (fail immediately)

#### Error Handling

**Client-side (sanitized)**:
- Rate limit: "Rate limit exceeded. Please try again later."
- Timeout: "Request timed out. Please try again."
- API error: "API error occurred."
- Generic: "Generation failed. Please try again."

**Server-side (full details)**:
- Logged to console with `[generateStructuredWithOpenAI]` prefix
- Useful for debugging production issues

#### Feature Parity with Anthropic Adapter

- Same singleton client pattern
- Same discriminated union result type (`success | error`)
- Same retry configuration and backoff strategy
- Same error sanitization approach
- Same token counting from response
- Compatible input/output interfaces (where applicable)

### Test Coverage

16 tests covering:
- ✓ Successful structured output generation
- ✓ Default model usage (gpt-4o)
- ✓ Custom model selection
- ✓ All options passed correctly
- ✓ Missing API key detection
- ✓ Error sanitization (generic, rate limit, timeout)
- ✓ Retry on rate limit (429, 503)
- ✓ No retry on non-retryable errors
- ✓ Max retry attempts (3)
- ✓ Missing usage information handling
- ✓ Token calculation when not provided
- ✓ Model constants validation
- ✓ Parity with Anthropic adapter patterns

## Dependencies

- **Blocks**: TASK-1-11 (brainHandle service - can now support both adapters)
- **Blocked by**: None
- **Related**: TASK-1-10 (Anthropic adapter - provides pattern reference)

## Related Documentation

- API Documentation: [docs/api/brain-adapter.md](/docs/api/brain-adapter.md) - Updated with OpenAI section
- Anthropic Adapter: [TASK-1-10](/tasks/completed/TASK-1-10-anthropic-adapter.md)
- Next task: TASK-1-11 (brainHandle service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Implementation started |
| 2025-12-02 | Completed: All acceptance criteria met, 16 tests passing, feature parity achieved |
