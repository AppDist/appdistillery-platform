---
id: TASK-1-08
title: recordUsage() service
priority: P1-High
complexity: 2
module: core
status: DONE
created: 2024-11-30
completed: 2025-12-02
---

# TASK-1-08: recordUsage() service

## Description

Create recordUsage() service function for tracking AI usage from Server Actions.

## Acceptance Criteria

- [x] recordUsage() function in packages/core
- [x] Accepts action, tenantId, userId, tokens, metadata
- [x] Inserts into usage_events table
- [x] Returns usage event record (discriminated union)
- [x] Type-safe with Zod validation
- [x] Exported from @appdistillery/core/ledger
- [x] Action format validation (module:domain:verb)
- [x] Supports Personal mode (nullable tenantId)
- [x] Uses service role client (bypasses RLS)
- [x] Unit tests written and passing

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
| 2025-12-02 | Implementation completed |

## Implementation Summary

**Files Created:**
- `/packages/core/src/ledger/types.ts` - Zod schemas and TypeScript types
- `/packages/core/src/ledger/record-usage.ts` - recordUsage() function implementation
- `/packages/core/src/ledger/record-usage.test.ts` - Unit tests
- `/packages/core/src/ledger/README.md` - API documentation

**Files Modified:**
- `/packages/core/src/ledger/index.ts` - Added exports

**Key Features:**
- Zod-validated input with `RecordUsageInputSchema`
- Action format validation: `module:domain:verb` (regex enforced)
- Service role client for RLS bypass (system operation)
- Discriminated union return type: `{ success: true, data }` | `{ success: false, error }`
- Supports nullable `tenantId` for Personal mode
- Camel case API with snake_case database mapping
- Computed column support for `tokens_total`

**Exports:**
- `recordUsage()` - Main function
- `RecordUsageInput` - Input type
- `RecordUsageInputSchema` - Zod schema for input
- `UsageEvent` - Output type
- `UsageEventSchema` - Zod schema for output

**Documentation Updated:**
- `.claude/skills/project-context/references/module-patterns.md` - Added usage tracking pattern with examples
- `.claude/skills/project-context/references/architecture-map.md` - Updated Ledger section with new exports
- `tasks/INDEX.md` - Moved task to completed
