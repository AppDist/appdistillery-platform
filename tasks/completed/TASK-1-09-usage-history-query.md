---
id: TASK-1-09
title: Usage history query
priority: P2-Medium
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
started: 2025-12-02
completed: 2025-12-02
---

# TASK-1-09: Usage history query

## Description

Create query functions for retrieving usage history with filtering and aggregation.

## Acceptance Criteria

- [x] getUsageHistory(tenantId, options) function with filtering and pagination
- [x] Filter by date range, action, module, user
- [x] Pagination support with limit and offset
- [x] getUsageSummary(tenantId, period) for period-based aggregates
- [x] Type-safe return values with Zod validation
- [x] Exported from @appdistillery/core/ledger
- [x] Full documentation with examples
- [x] Tests for both functions

## Implementation Summary

### Query Functions Implemented

**getUsageHistory(options: UsageHistoryOptions)**
- Location: `packages/core/src/ledger/get-usage-history.ts`
- Retrieves usage events with filtering and pagination
- Filters: tenantId (required), userId, action, moduleId, startDate, endDate
- Pagination: limit (default 100, max 1000), offset (default 0)
- Returns: success/error result with event array and total count
- Uses `createAuthClient()` to respect RLS policies

**getUsageSummary(tenantId, period)**
- Location: `packages/core/src/ledger/get-usage-summary.ts`
- Aggregates usage metrics over time periods (day, week, month)
- Returns: totalTokens, totalUnits, eventCount, and breakdown by action
- Calculates period start date automatically
- Results sorted by token usage (descending)
- Uses `createAuthClient()` for RLS-respecting queries

### Shared Utilities

**createAuthClient()**
- Location: `packages/core/src/ledger/supabase-client.ts`
- Creates Supabase client using anon key
- Enables RLS policy enforcement for queries
- Separate from admin client used by recordUsage()

### Type System

New types and schemas added to `packages/core/src/ledger/types.ts`:
- `UsageHistoryOptions` - Query options schema
- `UsageSummary` - Aggregated summary schema
- `UsageByAction` - Action-level breakdown
- `Period` - Time period enum ('day' | 'week' | 'month')

All types validated with Zod for runtime safety.

## Exports

From `@appdistillery/core/ledger`:
- `getUsageHistory` - Query function
- `getUsageSummary` - Aggregation function
- `UsageHistoryOptions` - Query options type
- `UsageSummary` - Summary result type
- `UsageByAction` - Action breakdown type
- `Period` - Period type

## Documentation

Updated `packages/core/src/ledger/README.md`:
- Complete API reference for both query functions
- Parameter descriptions and return types
- Practical examples for each function
- Multi-tenant and Personal mode usage patterns
- Notes on RLS policy enforcement

## Files Created/Modified

- `packages/core/src/ledger/get-usage-history.ts` - Query function (174 lines)
- `packages/core/src/ledger/get-usage-history.test.ts` - Unit tests
- `packages/core/src/ledger/get-usage-summary.ts` - Aggregation function (209 lines)
- `packages/core/src/ledger/get-usage-summary.test.ts` - Unit tests
- `packages/core/src/ledger/supabase-client.ts` - Shared utility (30 lines)
- `packages/core/src/ledger/types.ts` - Type definitions and schemas
- `packages/core/src/ledger/index.ts` - Exports updated
- `packages/core/src/ledger/README.md` - Documentation updated

## Dependencies

- **Blocked by**: TASK-1-07 (Usage events table) ✓ Completed
- **Blocks**: TASK-1-13 (Usage dashboard) - Ready to start

## Key Features

1. **Tenant Isolation** - All queries filter by tenantId, RLS enforces at DB level
2. **Personal Mode Support** - tenantId=null for users without active tenant
3. **Flexible Filtering** - Optional filters for action, module, user, date range
4. **Pagination** - Limit (1-1000) and offset for large result sets
5. **Aggregation** - Summary by period with action breakdown
6. **Type Safety** - Full Zod validation on input and output
7. **Error Handling** - Discriminated union results (success/error)
8. **RLS Aware** - Uses anon key client to respect database policies

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Implementation complete with tests |
| 2025-12-02 | Documentation updated in README |
| 2025-12-02 | Task marked complete |

## Testing

Both functions include comprehensive test suites:
- Validation error handling
- Filtering by various parameters
- Pagination behavior
- Aggregation accuracy
- Personal and tenant modes
- Error cases and edge conditions
