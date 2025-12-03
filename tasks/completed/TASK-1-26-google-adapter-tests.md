---
id: TASK-1-26
title: Create Google adapter tests
priority: P1-High
complexity: 3
module: core
status: COMPLETE
created: 2025-12-02
review-id: H1
fix-phase: 3
---

# TASK-1-26: Create Google Adapter Tests

## Description

The Anthropic and OpenAI adapters have comprehensive tests, but the Google adapter (`google.ts`) has none. Create a full test suite following the patterns established in `anthropic.test.ts`.

## Acceptance Criteria

- [x] All test cases pass
- [x] Coverage for `google.ts` reaches 90%+ (achieved 100% statements, 95% branches, 100% functions, 100% lines)
- [x] Tests follow project patterns (discriminated unions, etc.)
- [x] Mock `@ai-sdk/google` module correctly
- [x] Test retry logic for rate limits

## Technical Notes

### Test Cases to Create

```typescript
describe('generateStructuredWithGoogle', () => {
  it('should generate structured output successfully')
  it('should retry on rate limit errors')
  it('should not retry on non-retryable errors')
  it('should return error when API key missing')
  it('should use default model when not specified')
  it('should use singleton client pattern')
})
```

### Files to Create

- `packages/core/src/brain/adapters/google.test.ts` - New test file

### Patterns to Follow

- Follow test patterns from `packages/core/src/brain/adapters/anthropic.test.ts`
- Mock `@ai-sdk/google` module using vitest
- Test success path, retry path, and error paths
- Use discriminated union Result types for assertions

## Implementation Agent

- **Implement**: `test-engineer`
- **Review**: `code-reviewer`, `appdistillery-developer`

## Execution

- **Mode**: Parallel with H3, M1
- **Phase**: Fix Phase 3 (Testing Coverage)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H1 |
| 2025-12-03 | Completed: Created comprehensive test suite with 26 tests, 100% statement coverage, 95% branch coverage |

## Test Results

**Test Suite**: `packages/core/src/brain/adapters/google.test.ts`

### Coverage Report
```
-----------|---------|----------|---------|---------|-------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------|---------|----------|---------|---------|-------------------
All files  |     100 |       95 |     100 |     100 |
 google.ts |     100 |       95 |     100 |     100 | 176,232
-----------|---------|----------|---------|---------|-------------------
```

### Test Cases Implemented (26 tests)

**Success Path Tests:**
- Generates structured output successfully
- Uses default model when not specified
- Uses custom model when specified
- Passes all options to generateObject
- Uses singleton client pattern
- Uses maxOutputTokens parameter (not maxTokens)

**Error Handling Tests:**
- Returns error when API key is missing
- Returns sanitized error when generation fails
- Returns specific sanitized error for rate limits
- Returns specific sanitized error for timeouts
- Handles non-Error exceptions gracefully

**Retry Logic Tests:**
- Retries on rate limit errors (3 attempts)
- Retries on error with status code 429
- Retries on error with status code 502
- Retries on error with status code 503
- Retries on error with status code 504
- Retries on error with message "temporarily unavailable"
- Handles case-insensitive error message matching
- Does not retry on non-retryable errors
- Does not retry when status code is not retryable (e.g., 400)
- Returns sanitized error after max retries

**Usage Tracking Tests:**
- Handles missing usage information
- Calculates totalTokens when not provided

**Model Constants Tests:**
- Includes Gemini 3 family models
- Includes Gemini 2.5 family models
- Uses GEMINI_2_5_FLASH as default model

### Key Implementation Details

1. **Mock Strategy**: Followed exact pattern from `anthropic.test.ts`:
   - Mocked `ai` module's `generateObject` function
   - Mocked `@ai-sdk/google`'s `createGoogleGenerativeAI` function
   - Used helper `createMockResult()` to create AI SDK v5-compatible responses

2. **AI SDK v5 Compatibility**:
   - Used `inputTokens` instead of `promptTokens`
   - Used `outputTokens` instead of `completionTokens`
   - Used `maxOutputTokens` parameter (not `maxTokens`)

3. **Test Quality**:
   - AAA pattern (Arrange-Act-Assert)
   - Discriminated union type narrowing with `if (result.success)`
   - Clear test descriptions
   - Comprehensive edge case coverage

4. **Retry Testing**:
   - Verified exponential backoff logic
   - Tested all retryable status codes (429, 502, 503, 504)
   - Tested message-based retry detection
   - Verified non-retryable errors fail immediately

All tests pass successfully, achieving excellent coverage and following all project patterns.
