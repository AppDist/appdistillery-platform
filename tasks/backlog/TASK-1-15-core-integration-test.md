---
id: TASK-1-15
title: Core kernel integration test
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-15: Core kernel integration test

## Description

Create end-to-end integration test for the Core Kernel flow: signup → create org → call brainHandle → verify usage recorded.

## Acceptance Criteria

- [ ] Test full user journey from signup to AI usage
- [ ] Verify auth flow works
- [ ] Verify org creation works
- [ ] Verify brainHandle returns structured output
- [ ] Verify usage event recorded correctly
- [ ] Test runs against local Supabase + mocked AI

## Technical Notes

Integration test covering Phase 1 exit criteria:

```typescript
// packages/core/src/__tests__/integration/core-kernel.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Core Kernel Integration', () => {
  let userId: string
  let orgId: string

  describe('User Journey', () => {
    it('creates user via signup', async () => {
      // Sign up new user
      const { user, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'test-password',
      })

      expect(error).toBeNull()
      expect(user).toBeDefined()
      userId = user!.id
    })

    it('creates organization', async () => {
      // Create org for user
      const org = await createOrganization({
        name: 'Test Org',
        slug: 'test-org',
      })

      expect(org.id).toBeDefined()
      orgId = org.id
    })

    it('user is org member', async () => {
      // Verify user added to org_members
      const { data } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single()

      expect(data).toBeDefined()
      expect(data.role).toBe('owner')
    })
  })

  describe('AI Integration', () => {
    it('brainHandle returns structured output', async () => {
      // Mock AI response
      vi.mocked(generateStructured).mockResolvedValue({
        object: { summary: 'Test result' },
        usage: { promptTokens: 100, completionTokens: 50 },
      })

      const result = await brainHandle({
        task: 'test.task',
        action: 'test:task:run',
        schema: z.object({ summary: z.string() }),
        prompt: 'Test prompt',
        orgId,
      })

      expect(result.summary).toBe('Test result')
    })

    it('usage event recorded', async () => {
      // Verify usage_events has entry
      const { data } = await supabase
        .from('usage_events')
        .select('*')
        .eq('org_id', orgId)
        .eq('action', 'test:task:run')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(data).toBeDefined()
      expect(data.tokens_input).toBe(100)
      expect(data.tokens_output).toBe(50)
    })
  })

  afterAll(async () => {
    // Clean up test user and org
  })
})
```

### Files to Create/Modify

- `packages/core/src/__tests__/integration/core-kernel.test.ts`
- `packages/core/src/__tests__/integration/setup.ts` - Test setup

### Patterns to Follow

- Integration tests touch real database
- Mock external services (AI)
- Clean up after tests
- Use descriptive assertions

## Dependencies

- **Blocked by**: TASK-0-06 (Vitest), TASK-1-01-1-11 (All Core Kernel tasks)
- **Blocks**: None (validates Phase 1 complete)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
