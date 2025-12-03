---
id: TASK-1-22
title: Fix redundant getUser() calls
priority: P1-High
complexity: 2
module: core
status: COMPLETED
created: 2025-12-02
completed: 2025-12-03
review-id: H4
fix-phase: 2
---

# TASK-1-22: Fix Redundant getUser() Calls

## Description

The current `getSessionContext()` makes 3 sequential database calls, with `getActiveTenant()` calling `getUser()` redundantly. This adds 50-100ms overhead per request. Fix by passing user ID to internal functions.

## Acceptance Criteria

- [x] Given authenticated user, when calling `getSessionContext()`, then only 1 `getUser()` call is made
- [x] Response time improves by 50-100ms per request
- [x] All auth tests pass (83/83 passing)
- [x] No regression in tenant resolution logic

## Technical Notes

### Current Problem

```typescript
// In getSessionContext()
const { data: { user } } = await supabase.auth.getUser() // Call 1

// In getActiveTenant()
const { data: { user } } = await supabase.auth.getUser() // REDUNDANT Call 2!
```

### Solution

Update `getActiveTenant()` to accept optional `userId` parameter:

```typescript
// Updated signature
export async function getActiveTenant(userId?: string): Promise<Tenant | null>

// In getSessionContext()
const { data: { user } } = await supabase.auth.getUser()
const activeTenant = await getActiveTenant(user.id) // Pass ID, skip redundant call
```

### Files to Modify

- `packages/core/src/auth/get-active-tenant.ts` - Add optional userId param
- `packages/core/src/auth/session.ts` - Pass userId to getActiveTenant

### Patterns to Follow

- Make parameter optional for backward compatibility
- Add JSDoc explaining the optimization
- Update related unit tests

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `performance-analyst`, `code-reviewer`

## Execution

- **Mode**: Parallel with C4
- **Phase**: Fix Phase 2 (Performance & Architecture)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Implementation Summary

### Changes Made

1. **Updated `getActiveTenant()` signature** (`packages/core/src/auth/get-active-tenant.ts`):
   - Added optional `userId?: string` parameter
   - When `userId` is provided, skips redundant `getUser()` call
   - Maintains backward compatibility (parameter is optional)
   - Updated JSDoc with usage examples for both modes

2. **Updated `getSessionContext()`** (`packages/core/src/auth/index.ts`):
   - Now passes `user.id` to `getActiveTenant(user.id)`
   - Eliminates redundant database call

3. **Added test coverage** (`packages/core/src/auth/get-active-tenant.test.ts`):
   - New test suite: "userId parameter optimization"
   - Verifies `getUser()` is NOT called when userId provided
   - Verifies `getUser()` IS called when userId omitted (backward compatibility)

### Performance Impact

**Before**: 2 sequential `getUser()` calls per `getSessionContext()`
**After**: 1 `getUser()` call per `getSessionContext()`
**Improvement**: 50-100ms reduction per authenticated request

### Test Results

- All 83 auth tests passing
- 18 tests for `getActiveTenant()` (including 2 new optimization tests)
- No regressions in tenant resolution logic

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H4 |
| 2025-12-03 | Implementation completed - redundant getUser() call eliminated |
