---
id: TASK-1-14
title: RLS isolation test
priority: P1-High
complexity: 3
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-14: RLS isolation test

## Description

Create automated tests to verify RLS policies properly isolate tenant data.

## Acceptance Criteria

- [x] Test users can only see own tenant data
- [x] Test users cannot access other tenant data
- [x] Test cross-tenant query attempts fail
- [x] Test covers tenants, tenant_members, usage_events
- [x] Tests run against local Supabase
- [x] Documented test patterns for future tables

## Technical Notes

RLS verification tests:

```typescript
// packages/core/src/__tests__/security/rls-isolation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('RLS Tenant Isolation', () => {
  let userAClient: SupabaseClient
  let userBClient: SupabaseClient
  let tenantAId: string
  let tenantBId: string

  beforeAll(async () => {
    // Create two test users with their own tenants
    // User A in Tenant A
    // User B in Tenant B
  })

  describe('tenants table', () => {
    it('user A can only see Tenant A', async () => {
      const { data } = await userAClient
        .from('tenants')
        .select('*')

      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(tenantAId)
    })

    it('user A cannot see Tenant B', async () => {
      const { data } = await userAClient
        .from('tenants')
        .select('*')
        .eq('id', tenantBId)

      expect(data).toHaveLength(0)
    })
  })

  describe('usage_events table', () => {
    it('user A only sees Tenant A usage', async () => {
      // Create usage events for both tenants
      // Verify user A only sees Tenant A events
    })

    it('user B cannot query Tenant A usage', async () => {
      const { data } = await userBClient
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantAId)

      expect(data).toHaveLength(0)
    })
  })

  afterAll(async () => {
    // Clean up test data
  })
})
```

### Test Setup

Requires:
1. Local Supabase running
2. Migrations applied
3. Test users created with auth tokens
4. Test cleanup after each run

### Files to Create/Modify

- `packages/core/src/__tests__/security/rls-isolation.test.ts`
- `packages/core/src/__tests__/security/setup.ts` - Test helpers
- `packages/core/src/__tests__/security/fixtures.ts` - Test data

### Patterns to Follow

- Use separate Supabase clients per test user
- Test both positive (can access) and negative (cannot access)
- Clean up test data to avoid pollution
- Document pattern for adding new table tests

## Dependencies

- **Blocked by**: TASK-0-06 (Vitest), TASK-1-02 (Tenants), TASK-1-07 (Usage events)
- **Blocks**: None (critical security verification)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Completed: Full RLS isolation test suite + fixed RLS bug |

## Implementation Notes

### Files Created
- `packages/core/src/__tests__/security/rls-isolation.test.ts` - 22 test cases covering tenant isolation
- `packages/core/src/__tests__/security/rls-test-helpers.ts` - Test setup utilities
- `packages/core/src/__tests__/security/fixtures.ts` - Test data and constants
- `supabase/migrations/20251202201522_fix_tenant_members_rls_recursion.sql` - Critical RLS bug fix

### Key Discovery: RLS Bug Fixed
The tests discovered a critical infinite recursion bug in the `tenant_members` RLS policy. The original policy queried `tenant_members` from within its own policy, causing PostgreSQL to loop infinitely.

**Fix:** Created SECURITY DEFINER helper functions (`user_is_tenant_member`, `user_is_tenant_admin`, `user_is_tenant_owner`) that bypass RLS, breaking the recursion cycle.

### Test Coverage
- **tenants table**: 6 tests (positive/negative access)
- **tenant_members table**: 6 tests (own membership, tenant members visibility)
- **usage_events table**: 10 tests (tenant events, personal mode isolation)

### Pattern Documentation
The test file includes comprehensive documentation (lines 400+) for adding RLS tests to new tables, covering:
- Adding fixtures
- Creating helper functions
- Writing test suites
- Key testing points (positive, negative, list queries, personal mode)

### Future Improvements (Follow-up tasks)
- Add INSERT/UPDATE/DELETE operation tests
- Add user_profiles table tests
- Add privilege escalation tests
