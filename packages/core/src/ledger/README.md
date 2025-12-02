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

### getUsageHistory(options: UsageHistoryOptions)

Retrieves usage history with filtering and pagination. Respects RLS policies for tenant isolation.

**Parameters:**

- `tenantId` (string | null, required) - Tenant ID (null for Personal mode)
- `userId` (string, optional) - Filter by specific user
- `action` (string, optional) - Filter by action (e.g., "agency:scope:generate")
- `moduleId` (string, optional) - Filter by module ID
- `startDate` (string, optional) - Start date (ISO 8601 format)
- `endDate` (string, optional) - End date (ISO 8601 format)
- `limit` (number, default: 100) - Maximum records to return (max 1000)
- `offset` (number, default: 0) - Records to skip for pagination

**Returns:** `Promise<GetUsageHistoryResult>`

```typescript
type GetUsageHistoryResult =
  | { success: true; data: UsageEvent[]; count: number }
  | { success: false; error: string }
```

**Example:**

```typescript
import { getUsageHistory } from '@appdistillery/core/ledger'

// Get recent usage for tenant
const result = await getUsageHistory({
  tenantId: 'tenant-123',
  limit: 50,
  offset: 0
})

if (result.success) {
  console.log(`Found ${result.count} events`)
  result.data.forEach(event => {
    console.log(`${event.action}: ${event.tokensTotal} tokens`)
  })
}

// Filter by action and date range
const filtered = await getUsageHistory({
  tenantId: 'tenant-123',
  action: 'agency:scope:generate',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z'
})

// Personal mode (no tenant)
const personal = await getUsageHistory({
  tenantId: null,
  userId: 'user-456'
})
```

### getUsageSummary(tenantId: string | null, period: Period)

Aggregates usage metrics over a time period. Returns total tokens, units, and breakdown by action.

**Parameters:**

- `tenantId` (string | null, required) - Tenant ID (null for Personal mode)
- `period` ('day' | 'week' | 'month', required) - Time period for aggregation
  - `'day'` - Current calendar day
  - `'week'` - Current week (Sunday to today)
  - `'month'` - Current calendar month

**Returns:** `Promise<GetUsageSummaryResult>`

```typescript
type GetUsageSummaryResult =
  | { success: true; data: UsageSummary }
  | { success: false; error: string }

interface UsageSummary {
  totalTokens: number        // Total tokens consumed in period
  totalUnits: number         // Total Brain Units consumed
  eventCount: number         // Total number of events
  byAction: UsageByAction[]  // Breakdown by action
}

interface UsageByAction {
  action: string
  tokensTotal: number
  units: number
  count: number
}
```

**Example:**

```typescript
import { getUsageSummary } from '@appdistillery/core/ledger'

// Get today's usage for tenant
const result = await getUsageSummary('tenant-123', 'day')

if (result.success) {
  const { data } = result
  console.log(`Today: ${data.totalTokens} tokens, ${data.totalUnits} units`)
  console.log('By action:')
  data.byAction.forEach(action => {
    console.log(`  ${action.action}: ${action.count} calls`)
  })
}

// Get this month's usage for personal mode
const personal = await getUsageSummary(null, 'month')
if (personal.success) {
  console.log(`Month total: ${personal.data.totalTokens} tokens`)
}
```

## Supabase Client Utilities

### createAuthClient()

Creates a Supabase client using the anon key. Used by query functions (`getUsageHistory`, `getUsageSummary`) to respect RLS policies.

**Usage:**

```typescript
import { createAuthClient } from '@appdistillery/core/ledger/supabase-client'

const supabase = createAuthClient()
// Now use this for read queries that should respect RLS
```

**Note:** This is used internally by query functions. You typically don't need to call this directly.

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for authenticated queries (RLS)
- `SUPABASE_SECRET_KEY` - Service role key for admin operations (recordUsage only)

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
