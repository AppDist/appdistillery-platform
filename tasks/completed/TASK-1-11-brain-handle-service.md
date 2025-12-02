---
id: TASK-1-11
title: brainHandle() service
priority: P1-High
complexity: 3
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-11: brainHandle() service

## Description

Create brainHandle() service as the central AI router that handles prompts, generates structured output, and records usage.

## Acceptance Criteria

- [x] brainHandle() function in packages/core
- [x] Accepts task, schema, prompt, tenantId (renamed from orgId for consistency)
- [x] Uses Anthropic adapter for generation
- [x] Automatically calls recordUsage()
- [x] Returns typed object matching schema (discriminated union)
- [x] Exported from @appdistillery/core/brain

## Technical Notes

Central AI orchestration function:

```typescript
// packages/core/src/brain/brain-handle.ts
import { generateStructured } from './adapters/anthropic'
import { recordUsage } from '../ledger/record-usage'
import { z } from 'zod'

export interface BrainHandleOptions<T extends z.ZodType> {
  task: string          // e.g., 'agency.scope'
  action: string        // e.g., 'agency:scope:generate'
  schema: T
  prompt: string
  system?: string
  orgId: string
  userId?: string
  moduleId?: string
}

export async function brainHandle<T extends z.ZodType>(
  options: BrainHandleOptions<T>
): Promise<z.infer<T>> {
  // Generate structured output
  const result = await generateStructured({
    schema: options.schema,
    prompt: options.prompt,
    system: options.system,
  })

  // Record usage
  await recordUsage({
    action: options.action,
    orgId: options.orgId,
    userId: options.userId,
    moduleId: options.moduleId,
    tokensInput: result.usage.promptTokens,
    tokensOutput: result.usage.completionTokens,
    metadata: { task: options.task },
  })

  return result.object
}
```

### Usage in Server Actions

```typescript
// modules/agency/src/actions/generate-scope.ts
'use server'

import { brainHandle } from '@appdistillery/core/brain'
import { ScopeResultSchema } from '../schemas/scope'

export async function generateScope(leadId: string, orgId: string) {
  const result = await brainHandle({
    task: 'agency.scope',
    action: 'agency:scope:generate',
    schema: ScopeResultSchema,
    prompt: `Generate scope for lead...`,
    system: 'You are a consultancy scope generator...',
    orgId,
    moduleId: 'agency',
  })

  return result
}
```

### Files to Create/Modify

- `packages/core/src/brain/brain-handle.ts` - Main function
- `packages/core/src/brain/types.ts` - Type definitions
- `packages/core/src/brain/index.ts` - Public exports

### Patterns to Follow

- Never call AI providers directly (use brainHandle)
- Always provide Zod schema for output
- Always record usage automatically
- Task naming: `<module>.<task>`
- Action naming: `<module>:<domain>:<verb>`

## Dependencies

- **Blocked by**: TASK-1-08 (recordUsage), TASK-1-10 (Anthropic adapter)
- **Blocks**: TASK-2-02 (Agency AI capabilities)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Completed: Implemented brainHandle with discriminated union returns, 25 unit tests, 3 review rounds passed |
