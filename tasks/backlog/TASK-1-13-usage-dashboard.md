---
id: TASK-1-13
title: Usage dashboard component
priority: P2-Medium
complexity: 2
module: web
status: BACKLOG
created: 2024-11-30
---

# TASK-1-13: Usage dashboard component

## Description

Create a usage dashboard page showing organization's AI usage statistics and history.

## Acceptance Criteria

- [ ] Dashboard page at /dashboard/usage
- [ ] Usage summary cards (tokens, events)
- [ ] Usage chart (daily/weekly trend)
- [ ] Recent activity list
- [ ] Filter by date range
- [ ] Responsive layout

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
