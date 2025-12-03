---
id: TASK-1-31
title: Remove type assertions (as any)
priority: P2-Medium
complexity: 2
module: core
status: BACKLOG
created: 2025-12-02
review-id: M4
fix-phase: 4
---

# TASK-1-31: Remove Type Assertions (as any)

## Description

Several `as any` casts exist in the auth module, reducing type safety. Replace with proper type narrowing and generated database types.

## Acceptance Criteria

- [ ] Zero `as any` casts in core package
- [ ] All types properly inferred or explicitly typed
- [ ] TypeScript strict mode passes
- [ ] No runtime behavior change

## Technical Notes

### Current Problem

```typescript
// In getSessionContext()
const rawProfile = profileRow as any
const rawMembership = membershipRow as any
```

### Solution

1. Ensure database types are generated: `pnpm db:generate`
2. Import proper types from generated schema
3. Create transform functions with type narrowing
4. Replace `as any` with proper types

```typescript
import { Database } from '@appdistillery/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type TenantMember = Database['public']['Tables']['tenant_members']['Row']

function transformProfile(row: UserProfile): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    // ... properly typed transformation
  }
}
```

### Files to Modify

- `packages/core/src/auth/session.ts` - Remove as any casts
- `packages/core/src/auth/get-active-tenant.ts` - If any casts exist
- Any other files with `as any` in core package

### Patterns to Follow

- Use generated database types
- Create transform functions for complex mappings
- Use type guards where needed
- Avoid `as unknown as T` patterns

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with M2, M7, M8
- **Phase**: Fix Phase 4 (Code Quality & DRY)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M4 |
