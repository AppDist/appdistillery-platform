# TASK-1-41: Create shared adapter utility tests

---
id: TASK-1-41
title: Create shared adapter utility tests
status: COMPLETED
priority: P1-High
complexity: 2
module: core
created: 2025-12-03
completed: 2025-12-03
---

## Description

Create comprehensive tests for `packages/core/src/brain/adapters/shared.ts` which contains critical shared utilities used by all AI adapters.

## Background

The shared adapter utilities are currently untested despite being critical infrastructure for the brain service. This file contains retry logic, error handling, and usage extraction that all adapters depend on.

## Acceptance Criteria

- [x] Tests for `sleep()` function - timing verification (3 tests)
- [x] Tests for `isRetryableError()` - all error types (429, 502, 503, 504, messages) (15 tests)
- [x] Tests for `extractUsage()` - v4/v5 SDK compatibility (inputTokens vs promptTokens) (7 tests)
- [x] Tests for `sanitizeErrorMessage()` - all sanitization paths (9 tests)
- [x] Tests for `withRetry()` - exponential backoff, max retries, error handling (13 tests)
- [x] All tests pass with `pnpm test` (49 tests pass)
- [x] No TypeScript errors

## Implementation Summary

- Created `packages/core/src/brain/adapters/shared.test.ts` (641 lines)
- 49 comprehensive tests covering all exported utilities
- Proper use of `vi.useFakeTimers()` for timing verification
- Code review passed with no critical issues

## Technical Details

**File to test:** `packages/core/src/brain/adapters/shared.ts`
**Test file:** `packages/core/src/brain/adapters/shared.test.ts`

**Functions to test:**
1. `sleep(ms)` - Simple delay function
2. `isRetryableError(error)` - Checks if error is retryable (429, 502, 503, 504, rate limit messages)
3. `extractUsage(usage)` - Normalizes token usage from different SDK versions
4. `sanitizeErrorMessage(error, adapterName)` - User-friendly error messages
5. `withRetry(operation, config)` - Exponential backoff retry wrapper

**Test patterns to follow:**
- See `packages/core/src/brain/adapters/anthropic-adapter.test.ts` for mocking patterns
- Use `vi.useFakeTimers()` for timing tests
- Test edge cases and error conditions

## Dependencies

- Blocked by: None
- Blocks: TASK-1-49 (Adapter factory refactor needs tested shared utilities)

## Agent Assignment

Primary: test-engineer
