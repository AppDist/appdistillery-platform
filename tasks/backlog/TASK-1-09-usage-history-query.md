---
id: TASK-1-09
title: Usage history query
priority: P2-Medium
complexity: 2
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-09: Usage history query

## Description

Create query functions for retrieving usage history with filtering and aggregation.

## Acceptance Criteria

- [ ] getUsageHistory(orgId, options) function
- [ ] Filter by date range, action, module
- [ ] Pagination support
- [ ] getUsageSummary(orgId, period) for aggregates
- [ ] Type-safe return values
- [ ] Exported from @appdistillery/core/ledger

## Technical Notes

Query functions for usage data:

```typescript
// Usage history with filters
export interface UsageHistoryOptions {
  orgId: string
  startDate?: Date
  endDate?: Date
  action?: string
  moduleId?: string
  limit?: number
  offset?: number
}

export async function getUsageHistory(options: UsageHistoryOptions) {
  const supabase = await createClient()

  let query = supabase
    .from('usage_events')
    .select('*', { count: 'exact' })
    .eq('org_id', options.orgId)
    .order('created_at', { ascending: false })

  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString())
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString())
  }
  if (options.action) {
    query = query.eq('action', options.action)
  }
  if (options.moduleId) {
    query = query.eq('module_id', options.moduleId)
  }

  query = query.range(
    options.offset ?? 0,
    (options.offset ?? 0) + (options.limit ?? 50) - 1
  )

  return query
}

// Usage summary by period
export async function getUsageSummary(
  orgId: string,
  period: 'day' | 'week' | 'month'
) {
  // Aggregate tokens by period
  // Return { totalTokens, eventCount, byAction }
}
```

### Files to Create/Modify

- `packages/core/src/ledger/get-usage-history.ts`
- `packages/core/src/ledger/get-usage-summary.ts`
- `packages/core/src/ledger/index.ts` - Add exports

### Patterns to Follow

- Always filter by org_id
- Return count for pagination
- Use RLS (queries respect user's org access)

## Dependencies

- **Blocked by**: TASK-1-07 (Usage events table)
- **Blocks**: TASK-1-13 (Usage dashboard)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
