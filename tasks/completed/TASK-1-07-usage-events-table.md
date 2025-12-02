---
id: TASK-1-07
title: Usage events table + RLS
priority: P1-High
complexity: 2
module: database
status: COMPLETED
created: 2024-11-30
completed: 2025-12-02
---

# TASK-1-07: Usage events table + RLS

## Description

Create usage_events table for tracking AI usage and billable actions per tenant.

## Acceptance Criteria

- [x] usage_events table created
- [x] Indexes for common queries (tenant_id, created_at)
- [x] RLS policies for tenant isolation
- [x] Support for token counts and metadata
- [x] Support NULL tenant_id (users in "Personal" mode)
- [x] TypeScript types generated
- [x] Migration follows naming convention

## Technical Notes

Usage tracking for:
- AI token consumption
- Billable actions (scope generation, proposal generation)
- Audit trail

**Note**: tenant_id is optional - users can work in "Personal" mode without a tenant.

### Schema

```sql
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade, -- NULLABLE: users can work without tenant
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
create index usage_events_tenant_created_idx
  on usage_events(tenant_id, created_at desc);
create index usage_events_action_idx
  on usage_events(action);

-- RLS
alter table usage_events enable row level security;

create policy "Users can view own tenant usage"
  on usage_events for select
  using (tenant_id in (
    select tenant_id from tenant_members where user_id = auth.uid()
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
- tenant_id is optional (NULL for "Personal" mode users)
- Store token counts for billing

## Dependencies

- **Blocked by**: TASK-1-02 (Tenants table)
- **Blocks**: TASK-1-08 (recordUsage service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Migration created with full schema, indexes, and RLS policies |
| 2025-12-02 | TypeScript types generated |
| 2025-12-02 | Task completed |

## Implementation Summary

Created migration `20251202131205_create_usage_events.sql` with:
- Complete table schema with tenant isolation support
- Generated column for `tokens_total` (computed from input + output)
- Four indexes for common query patterns (tenant, action, user, module)
- Three RLS policies: tenant member access, personal mode access, service role bypass
- Comprehensive SQL comments documenting all fields
- Support for both tenant-scoped and Personal mode usage (nullable tenant_id)
