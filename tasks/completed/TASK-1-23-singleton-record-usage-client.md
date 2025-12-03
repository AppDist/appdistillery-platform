---
id: TASK-1-23
title: Singleton pattern for recordUsage admin client
priority: P2-Medium
complexity: 1
module: core
status: BACKLOG
created: 2025-12-02
review-id: M5
fix-phase: 2
---

# TASK-1-23: Singleton Pattern for recordUsage Admin Client

## Description

The current `recordUsage()` creates a new Supabase admin client per call, adding 5-20ms overhead. Apply the singleton pattern already used in brain adapters.

## Acceptance Criteria

- [ ] Given 100 sequential `recordUsage()` calls, when measuring, then only 1 client instantiation occurs
- [ ] No change in behavior or test results
- [ ] Performance improvement measurable in tests

## Technical Notes

### Current Problem

```typescript
function createAdminClient() {
  // Creates new client every time - 5-20ms overhead
  return createClient<Database>(supabaseUrl, supabaseSecretKey, { ... })
}
```

### Solution

Apply singleton pattern:

```typescript
let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null

function getAdminClient() {
  if (!cachedAdminClient) {
    cachedAdminClient = createClient<Database>(supabaseUrl, supabaseSecretKey, { ... })
  }
  return cachedAdminClient
}
```

### Files to Modify

- `packages/core/src/ledger/record-usage.ts` - Apply singleton pattern

### Patterns to Follow

- Follow pattern from `packages/core/src/brain/adapters/anthropic.ts`
- Keep existing error handling
- Export helper for testing if needed

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with H4, H5, L7
- **Phase**: Fix Phase 2 (Performance & Architecture)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M5 |
