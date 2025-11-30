---
id: TASK-1-07
title: Usage events table + RLS
priority: P1-High
complexity: 2
module: database
status: BACKLOG
created: 2024-11-30
---

# TASK-1-07: Usage events table + RLS

## Description

Create usage_events table for tracking AI usage and billable actions per organization.

## Acceptance Criteria

- [ ] usage_events table created
- [ ] Indexes for common queries (org_id, created_at)
- [ ] RLS policies for tenant isolation
- [ ] Support for token counts and metadata
- [ ] TypeScript types generated
- [ ] Migration follows naming convention

## Technical Notes

Usage tracking for:
- AI token consumption
- Billable actions (scope generation, proposal generation)
- Audit trail

### Schema

```sql
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null, -- e.g., 'agency:scope:generate'
  module_id text, -- e.g., 'agency'
  tokens_input int default 0,
  tokens_output int default 0,
  tokens_total int generated always as (tokens_input + tokens_output) stored,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index usage_events_org_created_idx
  on usage_events(org_id, created_at desc);
create index usage_events_action_idx
  on usage_events(action);

-- RLS
alter table usage_events enable row level security;

create policy "Users can view own org usage"
  on usage_events for select
  using (org_id in (
    select org_id from org_members where user_id = auth.uid()
  ));

-- Only allow inserts via service role or authenticated
create policy "Authenticated can insert usage"
  on usage_events for insert
  with check (auth.uid() is not null);
```

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_create_usage_events.sql`
- `packages/database/src/types/database.ts` - Generated types

### Patterns to Follow

- Action format: `<module>:<domain>:<verb>`
- Always include org_id
- Store token counts for billing

## Dependencies

- **Blocked by**: TASK-1-02 (Organizations)
- **Blocks**: TASK-1-08 (recordUsage service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
