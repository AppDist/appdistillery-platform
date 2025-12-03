# TASK-1-44: tenant_modules RLS isolation tests

---
id: TASK-1-44
title: tenant_modules RLS isolation tests
status: COMPLETED
priority: P1-High
complexity: 3
module: core
created: 2025-12-03
completed: 2025-12-03
---

## Description

Add RLS isolation tests for the `tenant_modules` table to the existing RLS test suite. These tests verify that users can only see modules installed for their tenants.

## Background

The existing RLS isolation tests (`packages/core/src/__tests__/security/rls-isolation.test.ts`) cover `tenants`, `tenant_members`, and `usage_events` tables, but not `tenant_modules`. This gap was identified in the Phase 0/1 review.

## Acceptance Criteria

- [x] Add `tenant_modules` table RLS tests to existing test suite (6 tests)
- [x] Test: User A can see modules installed for Tenant A
- [x] Test: User A cannot see modules installed for Tenant B
- [x] Test: User B can see modules installed for Tenant B
- [x] Test: User B cannot see modules installed for Tenant A
- [x] Test: Module settings are isolated per tenant (via query filtering)
- [x] All tests pass with `pnpm test` (28 total, 6 new)
- [x] No TypeScript errors

## Implementation Summary

- Modified 3 files (165 lines added)
- Added TEST_TENANT_MODULES to fixtures.ts
- Added createTestTenantModule helper to rls-test-helpers.ts
- Added 6 test cases to rls-isolation.test.ts
- Tests auto-skip when Supabase unavailable

## Technical Details

**File to modify:** `packages/core/src/__tests__/security/rls-isolation.test.ts`

**Add to fixtures.ts:**
```typescript
export const TEST_TENANT_MODULES = {
  tenantAModule: {
    module_id: 'agency',
    enabled: true,
    settings: { featureA: true },
  },
  tenantBModule: {
    module_id: 'billing',
    enabled: true,
    settings: { featureB: true },
  },
} as const
```

**Add helper to rls-test-helpers.ts:**
```typescript
export async function createTestTenantModule(
  serviceClient: SupabaseClient<Database>,
  tenantId: string,
  moduleData: {...}
): Promise<string>
```

**Test suite structure:**
```typescript
describe('tenant_modules table RLS', () => {
  it('User A can see Tenant A modules')
  it('User A cannot see Tenant B modules')
  it('User B can see Tenant B modules')
  it('User B cannot see Tenant A modules')
  it('User A sees only Tenant A modules when querying all')
  it('User B sees only Tenant B modules when querying all')
})
```

**Reference:** Follow exact patterns from existing `tenants table RLS` and `usage_events table RLS` test blocks.

## Dependencies

- Blocked by: None
- Blocks: None

## Agent Assignment

Primary: test-engineer
