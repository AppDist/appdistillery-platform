---
id: TASK-1-29
title: Extract shared adapter utilities
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2025-12-02
review-id: H2
fix-phase: 4
---

# TASK-1-29: Extract Shared Adapter Utilities

## Description

Three brain adapters share near-identical code (~240 lines duplicated). Extract shared utilities into a common module to improve maintainability and reduce code duplication.

## Acceptance Criteria

- [ ] All duplicate functions extracted to `shared.ts`
- [ ] All adapter tests pass
- [ ] Line count reduced by ~180 lines
- [ ] No behavior change (verified by tests)
- [ ] Clean TypeScript with no type assertions

## Technical Notes

### Duplicated Code

- `sleep()` function - 3 copies
- `isRetryableError()` function - 3 copies
- `sanitizeErrorMessage()` function - 3 copies
- Retry loop logic - 3 copies
- `GenerateResult<T>` type - 3 definitions

### Solution

Create `packages/core/src/brain/adapters/shared.ts`:

```typescript
// Shared utilities
export function sleep(ms: number): Promise<void>
export function isRetryableError(error: unknown): boolean
export function sanitizeErrorMessage(error: Error): string
export type GenerateResult<T> =
  | { success: true; object: T; usage: Usage }
  | { success: false; error: string }

// Shared retry wrapper
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  initialDelay: number,
  maxDelay: number
): Promise<T>
```

### Files to Create/Modify

- `packages/core/src/brain/adapters/shared.ts` - New shared utilities
- `packages/core/src/brain/adapters/anthropic.ts` - Refactor to use shared
- `packages/core/src/brain/adapters/openai.ts` - Refactor to use shared
- `packages/core/src/brain/adapters/google.ts` - Refactor to use shared

### Patterns to Follow

- Keep existing function signatures
- Export types for external use
- Add JSDoc documentation
- Maintain backward compatibility

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `architecture-advisor`, `code-reviewer`

## Execution

- **Mode**: Sequential (careful refactoring)
- **Phase**: Fix Phase 4 (Code Quality & DRY)

## Dependencies

- **Blocked by**: TASK-1-26 (Google adapter tests - need tests before refactoring)
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H2 |
