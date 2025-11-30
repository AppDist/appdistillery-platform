---
id: TASK-1-05
title: Module registry tables
priority: P1-High
complexity: 2
module: database
status: BACKLOG
created: 2024-11-30
---

# TASK-1-05: Module registry tables

## Description

Create database tables for tracking installed modules per organization.

## Acceptance Criteria

- [ ] modules table (system-wide module catalog)
- [ ] org_modules table (installed modules per org)
- [ ] RLS policies for module access
- [ ] TypeScript types generated
- [ ] Migration follows naming convention

## Technical Notes

Module registry enables:
- Track which modules are available
- Track which modules each org has enabled
- Future: module-specific settings per org

### Schema

```sql
-- Available modules (system catalog)
create table public.modules (
  id text primary key, -- e.g., 'agency'
  name text not null,
  description text,
  version text default '1.0.0',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Installed modules per organization
create table public.org_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  module_id text references modules(id),
  enabled boolean default true,
  installed_at timestamptz default now(),
  settings jsonb default '{}',
  unique(org_id, module_id)
);

-- RLS
alter table org_modules enable row level security;

create policy "Users can view own org modules"
  on org_modules for select
  using (org_id in (
    select org_id from org_members where user_id = auth.uid()
  ));
```

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_create_module_registry.sql`
- `packages/database/src/types/database.ts` - Generated types

### Patterns to Follow

- Module IDs are text slugs (e.g., 'agency')
- org_modules tracks per-org installation
- settings JSONB for future module config

## Dependencies

- **Blocked by**: TASK-1-02 (Organizations)
- **Blocks**: TASK-1-06 (Module helpers), TASK-2-04 (Agency manifest)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
