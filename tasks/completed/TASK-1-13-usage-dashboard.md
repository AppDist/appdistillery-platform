---
id: TASK-1-13
title: Usage dashboard component
priority: P2-Medium
complexity: 2
module: web
status: COMPLETED
created: 2024-11-30
completed: 2025-12-02
---

# TASK-1-13: Usage dashboard component

## Description

Create a usage dashboard page showing organization's AI usage statistics and history.

## Acceptance Criteria

- [x] Dashboard page at /dashboard/usage
- [x] Usage summary cards (tokens, events)
- [x] Usage chart (daily/weekly trend)
- [x] Recent activity list
- [x] Filter by date range
- [x] Responsive layout

## Technical Notes

Dashboard displays:
1. Summary statistics (total tokens, event count)
2. Usage trend chart
3. Recent usage events table
4. Filters for date range and action type

### Components

```typescript
// Usage summary cards
function UsageSummary({ orgId }: { orgId: string }) {
  const summary = await getUsageSummary(orgId, 'month')

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Total Tokens</CardHeader>
        <CardContent>{summary.totalTokens.toLocaleString()}</CardContent>
      </Card>
      {/* More cards */}
    </div>
  )
}

// Usage chart
function UsageChart({ data }: { data: UsageByDay[] }) {
  // Use recharts or similar for visualization
}

// Recent activity table
function RecentActivity({ events }: { events: UsageEvent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      {/* Table body */}
    </Table>
  )
}
```

### Files to Create/Modify

- `apps/web/src/app/(dashboard)/usage/page.tsx` - Main page
- `apps/web/src/app/(dashboard)/usage/usage-summary.tsx`
- `apps/web/src/app/(dashboard)/usage/usage-chart.tsx`
- `apps/web/src/app/(dashboard)/usage/recent-activity.tsx`
- Install shadcn Card, Table components

### Patterns to Follow

- Server Components for data fetching
- Use getUsageSummary and getUsageHistory from core
- Responsive with mobile-first approach
- Use shadcn/ui components

## Dependencies

- **Blocked by**: TASK-1-09 (Usage history query)
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Completed: Full usage dashboard implementation |

## Implementation Notes

### Files Created
- `apps/web/src/app/(dashboard)/usage/page.tsx` - Main dashboard page
- `apps/web/src/app/(dashboard)/usage/usage-summary.tsx` - Summary cards (4 metrics)
- `apps/web/src/app/(dashboard)/usage/usage-chart.tsx` - Area chart with recharts
- `apps/web/src/app/(dashboard)/usage/recent-activity.tsx` - Activity table
- `apps/web/src/app/(dashboard)/usage/period-selector.tsx` - Period filter dropdown
- `apps/web/src/components/ui/table.tsx` - shadcn table component
- `apps/web/src/components/ui/select.tsx` - shadcn select component
- `apps/web/src/components/ui/calendar.tsx` - shadcn calendar component
- `apps/web/src/components/ui/popover.tsx` - shadcn popover component

### Features
- Usage summary with 4 cards (tokens, units, events, top action)
- Area chart showing tokens and Brain Units over time
- Recent activity table with relative timestamps
- Period selector (Today, This Week, This Month)
- Responsive grid layouts
- Suspense boundaries with skeleton loaders
- Accessibility: ARIA labels, sr-only text, semantic HTML

### Packages Added
- recharts (^3.5.1) for chart visualization
