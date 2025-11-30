---
id: TASK-1-14
title: RLS isolation test
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-14: RLS isolation test

## Description

Create automated tests to verify RLS policies properly isolate tenant data.

## Acceptance Criteria

- [ ] Test users can only see own org data
- [ ] Test users cannot access other org data
- [ ] Test cross-org query attempts fail
- [ ] Test covers organizations, org_members, usage_events
- [ ] Tests run against local Supabase
- [ ] Documented test patterns for future tables

## Technical Notes

RLS verification tests:

```typescript
// packages/core/src/__tests__/security/rls-isolation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('RLS Tenant Isolation', () => {
  let userAClient: SupabaseClient
  let userBClient: SupabaseClient
  let orgAId: string
  let orgBId: string

  beforeAll(async () => {
    // Create two test users with their own orgs
    // User A in Org A
    // User B in Org B
  })

  describe('organizations table', () => {
    it('user A can only see Org A', async () => {
      const { data } = await userAClient
        .from('organizations')
        .select('*')

      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(orgAId)
    })

    it('user A cannot see Org B', async () => {
      const { data } = await userAClient
        .from('organizations')
        .select('*')
        .eq('id', orgBId)

      expect(data).toHaveLength(0)
    })
  })

  describe('usage_events table', () => {
    it('user A only sees Org A usage', async () => {
      // Create usage events for both orgs
      // Verify user A only sees Org A events
    })

    it('user B cannot query Org A usage', async () => {
      const { data } = await userBClient
        .from('usage_events')
        .select('*')
        .eq('org_id', orgAId)

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

- **Blocked by**: TASK-0-06 (Vitest), TASK-1-02 (Organizations), TASK-1-07 (Usage events)
- **Blocks**: None (critical security verification)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
