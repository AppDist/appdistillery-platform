---
id: TASK-1-10
title: Anthropic adapter
priority: P1-High
complexity: 3
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-10: Anthropic adapter

## Description

Create Anthropic AI adapter using Vercel AI SDK for structured output generation with robust error handling and token counting.

## Acceptance Criteria

- [x] @ai-sdk/anthropic installed
- [x] Anthropic model configuration with all Claude versions
- [x] generateStructured() helper for type-safe structured output
- [x] Token counting from response (prompt, completion, total)
- [x] Error handling with exponential backoff retry logic (max 10s ceiling)
- [x] Environment variable: ANTHROPIC_API_KEY validation
- [x] Error sanitization (generic messages to clients, full details logged)
- [x] 16 comprehensive tests covering all scenarios

## Implementation Summary

### Files Created

1. **`packages/core/src/brain/adapters/anthropic.ts`** - Main adapter implementation
   - `generateStructured<T>()` - Type-safe structured output generation
   - `ANTHROPIC_MODELS` - Model constants for all Claude versions
   - Singleton client pattern for performance
   - Retry logic with exponential backoff (up to 10 second ceiling)
   - Error sanitization for client/server safety
   - Token counting from responses

2. **`packages/core/src/brain/adapters/index.ts`** - Module exports
   - Exports: `generateStructured`, `ANTHROPIC_MODELS`, types

3. **`packages/core/src/brain/adapters/anthropic.test.ts`** - Comprehensive test suite
   - 16 tests covering all functionality
   - Mock Vercel AI SDK and @ai-sdk/anthropic
   - Tests for success cases, error handling, retries, token counting

### Key Features

#### Type-Safe Structured Output

```typescript
const result = await generateStructured({
  schema: ScopeResultSchema,
  prompt: 'Analyze this lead...',
  system: 'You are a consultancy expert',
});

if (result.success) {
  console.log(result.object.deliverables);
  console.log(`Used ${result.usage.totalTokens} tokens`);
} else {
  console.error(result.error); // Sanitized error message
}
```

#### Model Configuration

Supports all Claude versions:
- Claude 4.5 (Latest): `claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20250929`
- Claude 4: `claude-sonnet-4-20250514`
- Claude 3.5: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- Claude 3: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

Default model: `claude-sonnet-4-5-20250929` (Claude 4.5 Sonnet)

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
- Logged to console with `[generateStructured]` prefix
- Useful for debugging production issues

### Test Coverage

16 tests covering:
- ✓ Successful structured output generation
- ✓ Default model usage
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

## Dependencies

- **Blocks**: TASK-1-11 (brainHandle service)
- **Blocked by**: None

## Related Documentation

- API Documentation: [docs/api/brain-adapter.md](/docs/api/brain-adapter.md)
- Next task: TASK-1-11 (brainHandle service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Implementation started |
| 2025-12-02 | Completed: All acceptance criteria met, 16 tests passing |
