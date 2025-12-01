---
id: TASK-2-01
title: Agency database schema
priority: P1-High
complexity: 4
module: agency
status: BACKLOG
type: EPIC
created: 2024-11-30
---

# TASK-2-01: Agency database schema

## Description

Create database schema for the Agency module including leads, briefs, and proposals tables.

## Epic Overview

This epic covers all database work for the Agency module. Will be decomposed into sub-tasks when Phase 2 begins.

## Sub-tasks (to be created)

- [ ] Create agency_leads table + RLS
- [ ] Create agency_briefs table + RLS
- [ ] Create agency_proposals table + RLS
- [ ] Add indexes for common queries
- [ ] Generate TypeScript types
- [ ] Verify RLS with isolation tests

## Acceptance Criteria (Epic Level)

- [ ] All Agency tables created with proper foreign keys
- [ ] RLS policies enforce tenant_id tenant isolation
- [ ] TypeScript types generated and exported
- [ ] Tables follow naming convention (agency_*)
- [ ] Migrations are reversible

## Technical Notes

Agency module tables:

```sql
-- agency_leads: Client/project intake
create table public.agency_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  client_name text not null,
  project_description text,
  budget_range text,
  timeline text,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- agency_briefs: AI-generated scope from lead
create table public.agency_briefs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  lead_id uuid references agency_leads(id),
  scope jsonb not null, -- AI-generated structured scope
  created_at timestamptz default now()
);

-- agency_proposals: Generated proposals
create table public.agency_proposals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  brief_id uuid references agency_briefs(id),
  content jsonb not null, -- Proposal sections
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Patterns to Follow

- All tables include tenant_id (never omit)
- RLS policies check tenant_members for access
- Use timestamptz for dates
- jsonb for structured AI output
- Naming: agency_<entity>

## Dependencies

- **Blocked by**: TASK-1-02 (Tenants RLS)
- **Blocks**: TASK-2-02 (AI capabilities), TASK-2-03 (UI)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Epic created - will decompose when starting Phase 2 |
