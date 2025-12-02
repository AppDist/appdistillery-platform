# Ledger Module

The Ledger module provides usage tracking and billing functionality for the AppDistillery Platform.

## Overview

- `recordUsage()` - Record AI operations and track token consumption
- Supports multi-tenant and personal mode
- Validates input with Zod schemas
- Uses service role for database writes (bypasses RLS)

## Usage

### Basic Example

```typescript
import { recordUsage } from '@appdistillery/core/ledger'

const result = await recordUsage({
  action: 'agency:scope:generate',
  tenantId: session.tenant?.id, // null for Personal mode
  userId: session.user.id,
  moduleId: 'agency',
  tokensInput: 1200,
  tokensOutput: 800,
  units: 50,
  durationMs: 2500,
  metadata: { leadId: 'lead-123' }
})

if (!result.success) {
  console.error('Failed to record usage:', result.error)
}
```

### Server Action Pattern

```typescript
'use server'

import { brainHandle } from '@appdistillery/core/brain'
import { recordUsage } from '@appdistillery/core/ledger'
import { getSessionContext } from '@appdistillery/core/auth'

export async function generateScope(briefId: string) {
  // 1. Get session context
  const session = await getSessionContext()
  if (!session) throw new Error('Unauthorized')

  // 2. Call AI operation
  const result = await brainHandle({
    task: 'agency.scope',
    input: { briefId },
    outputSchema: ScopeResultSchema,
  })

  // 3. Record usage
  await recordUsage({
    action: 'agency:scope:generate',
    tenantId: session.tenant?.id, // null for Personal mode
    userId: session.user.id,
    moduleId: 'agency',
    tokensInput: result.usage.tokensInput,
    tokensOutput: result.usage.tokensOutput,
    units: 50,
    durationMs: result.usage.durationMs,
    metadata: { briefId }
  })

  return result.output
}
```

## API Reference

### recordUsage(input: RecordUsageInput)

Records a usage event in the `usage_events` table.

**Parameters:**

- `action` (string, required) - Action identifier in format `<module>:<domain>:<verb>`
  - Example: `"agency:scope:generate"`
- `tenantId` (string | null, optional) - Tenant ID (null for Personal mode)
- `userId` (string | null, optional) - User ID
- `moduleId` (string | null, optional) - Module ID (e.g., "agency")
- `tokensInput` (number, default: 0) - Input tokens consumed
- `tokensOutput` (number, default: 0) - Output tokens consumed
- `units` (number, default: 0) - Brain Units cost
- `durationMs` (number | null, optional) - Operation duration in milliseconds
- `metadata` (Record<string, unknown>, optional) - Additional metadata

**Returns:** `Promise<RecordUsageResult>`

```typescript
type RecordUsageResult =
  | { success: true; data: UsageEvent }
  | { success: false; error: string }
```

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SECRET_KEY` - Service role key for admin operations

## Naming Conventions

### Action Format

```
<module>:<domain>:<verb>
```

Examples:
- `agency:scope:generate` - Generate project scope
- `agency:proposal:draft` - Draft proposal
- `agency:brief:analyze` - Analyze brief

### Metadata Keys

Use camelCase for metadata keys:

```typescript
{
  leadId: 'lead-123',
  briefId: 'brief-456',
  proposalId: 'proposal-789',
  // ...
}
```

## Multi-Tenant Support

The `tenantId` field is optional to support Personal mode:

- **Tenant Mode**: User has an active tenant selected
  - `tenantId` = `session.tenant.id`
- **Personal Mode**: User working without a tenant
  - `tenantId` = `null`

## Error Handling

```typescript
const result = await recordUsage({
  action: 'agency:scope:generate',
  tokensInput: 1200,
  tokensOutput: 800,
  units: 50,
})

if (!result.success) {
  // Log error but don't throw - usage recording shouldn't break operations
  console.error('[Usage] Failed to record:', result.error)
}
```

## Testing

See `record-usage.test.ts` for examples:

```typescript
import { describe, it, expect } from 'vitest'
import { recordUsage } from './record-usage'

it('records usage event successfully', async () => {
  const result = await recordUsage({
    action: 'agency:scope:generate',
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    tokensInput: 1200,
    tokensOutput: 800,
    units: 50,
  })

  expect(result.success).toBe(true)
})
```
