---
id: TASK-1-05
title: Module registry tables
priority: P1-High
complexity: 2
module: database
status: DONE
created: 2024-11-30
started: 2025-12-01
completed: 2025-12-01
---

# TASK-1-05: Module registry tables

## Description

Create database tables for tracking installed modules per organization.

## Acceptance Criteria

- [x] modules table (system-wide module catalog)
- [x] tenant_modules table (installed modules per tenant)
- [x] RLS policies for module access
- [x] TypeScript types generated
- [x] Migration follows naming convention

## Technical Notes

Module registry enables:
- Track which modules are available
- Track which modules each tenant has enabled
- Future: module-specific settings per tenant

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

-- Installed modules per tenant
create table public.tenant_modules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  module_id text references modules(id),
  enabled boolean default true,
  installed_at timestamptz default now(),
  settings jsonb default '{}',
  unique(tenant_id, module_id)
);

-- RLS
alter table tenant_modules enable row level security;

create policy "Users can view own tenant modules"
  on tenant_modules for select
  using (tenant_id in (
    select tenant_id from tenant_members where user_id = auth.uid()
  ));
```

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_create_module_registry.sql`
- `packages/database/src/types/database.ts` - Generated types

### Patterns to Follow

- Module IDs are text slugs (e.g., 'agency')
- tenant_modules tracks per-tenant installation
- settings JSONB for future module config

## Dependencies

- **Blocked by**: TASK-1-02 (Tenants)
- **Blocks**: TASK-1-06 (Module helpers), TASK-2-04 (Agency manifest)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-01 | Implementation completed |

## Implementation Summary

### Files Created

- `supabase/migrations/20251201160000_create_module_registry.sql` - Complete migration

### Tables Created

**`modules` (System Catalog):**
- `id TEXT PRIMARY KEY` - Semantic identifier (e.g., 'agency')
- `name TEXT NOT NULL` - Display name
- `description TEXT` - Module description
- `version TEXT DEFAULT '1.0.0'` - Semver version
- `is_active BOOLEAN DEFAULT true` - Availability flag
- `created_at TIMESTAMPTZ`

**`tenant_modules` (Per-Tenant Installations):**
- `id UUID PRIMARY KEY`
- `tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`
- `module_id TEXT REFERENCES modules(id) ON DELETE CASCADE`
- `enabled BOOLEAN DEFAULT true`
- `settings JSONB DEFAULT '{}'`
- `installed_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ` (with trigger)
- `UNIQUE(tenant_id, module_id)`

### RLS Policies (7 total)

**modules:**
- `authenticated_can_view_modules` - All authenticated users can view catalog
- `service_role_all_modules` - Service role bypass

**tenant_modules:**
- `users_can_view_tenant_modules` - View own tenant's modules
- `admins_can_insert_tenant_modules` - Install (validates module exists + is_active)
- `admins_can_update_tenant_modules` - Update settings (WITH CHECK clause)
- `admins_can_delete_tenant_modules` - Uninstall
- `service_role_all_tenant_modules` - Service role bypass

### Seed Data

- 'agency' module seeded as initial module

### Additional Work

- Fixed org→tenant naming inconsistencies across documentation
- Updated PROJECT_PLAN.md, CONTEXT.md, module-patterns.md
- Updated backlog tasks (1-06, 1-07, 1-14, 2-01) to use tenant_id
