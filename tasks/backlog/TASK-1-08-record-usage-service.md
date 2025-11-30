---
id: TASK-1-08
title: recordUsage() service
priority: P1-High
complexity: 2
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-08: recordUsage() service

## Description

Create recordUsage() service function for tracking AI usage from Server Actions.

## Acceptance Criteria

- [ ] recordUsage() function in packages/core
- [ ] Accepts action, orgId, tokens, metadata
- [ ] Inserts into usage_events table
- [ ] Returns usage event record
- [ ] Type-safe with Zod validation
- [ ] Exported from @appdistillery/core/ledger

## Technical Notes

Central usage tracking function:

```typescript
// packages/core/src/ledger/record-usage.ts
import { createClient } from '@/auth/supabase-server'
import { z } from 'zod'

const UsageEventSchema = z.object({
  action: z.string(), // e.g., 'agency:scope:generate'
  orgId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  moduleId: z.string().optional(),
  tokensInput: z.number().int().min(0).default(0),
  tokensOutput: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).optional(),
})

export type UsageEvent = z.infer<typeof UsageEventSchema>

export async function recordUsage(event: UsageEvent) {
  const validated = UsageEventSchema.parse(event)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('usage_events')
    .insert({
      action: validated.action,
      org_id: validated.orgId,
      user_id: validated.userId,
      module_id: validated.moduleId,
      tokens_input: validated.tokensInput,
      tokens_output: validated.tokensOutput,
      metadata: validated.metadata ?? {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Files to Create/Modify

- `packages/core/src/ledger/record-usage.ts` - Main function
- `packages/core/src/ledger/types.ts` - Type definitions
- `packages/core/src/ledger/index.ts` - Public exports

### Patterns to Follow

- Use Zod for input validation
- Always require orgId
- Return the created record
- Never write to usage_events directly (use this function)

## Dependencies

- **Blocked by**: TASK-1-07 (Usage events table)
- **Blocks**: TASK-1-11 (brainHandle integration)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
