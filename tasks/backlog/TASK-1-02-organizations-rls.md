---
id: TASK-1-02
title: Tenants & account types + RLS
priority: P1-High
complexity: 3
module: database
status: BACKLOG
created: 2024-11-30
---

# TASK-1-02: Tenants & account types + RLS

## Description

Create identity tables supporting three account types: Personal (individual), Household (shared family), and Organization (business). Foundation for multi-tenancy with proper RLS isolation.

## Account Types

| Type | Description | Usage Pool |
|------|-------------|------------|
| **Personal** | Individual user, email only | Per-user |
| **Household** | Shared group (family/friends) | Shared pool |
| **Organization** | Business with org details | Shared pool |

## Acceptance Criteria

- [ ] user_profiles table (extends auth.users)
- [ ] tenants table (for households + organizations)
- [ ] tenant_members junction table
- [ ] RLS policies enforce tenant isolation
- [ ] Personal users work without tenant
- [ ] Usage can be tracked per-user OR per-tenant
- [ ] TypeScript types generated
- [ ] Migration follows naming convention

## Technical Notes

### Schema Design

```sql
-- User profiles (extends Supabase Auth)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenants (households + organizations)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('household', 'organization')),
  name text not null,
  slug text unique not null,
  -- Organization-specific fields (null for households)
  org_number text,  -- Business registration number
  billing_email text,
  -- Settings
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenant members (user <-> tenant relationship)
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  unique(tenant_id, user_id)
);

-- Indexes
create index idx_tenant_members_user on tenant_members(user_id);
create index idx_tenant_members_tenant on tenant_members(tenant_id);

-- RLS Policies
alter table user_profiles enable row level security;
alter table tenants enable row level security;
alter table tenant_members enable row level security;

-- Users can view their own profile
create policy "Users can view own profile"
  on user_profiles for select
  using (id = auth.uid());

-- Users can view tenants they belong to
create policy "Users can view own tenants"
  on tenants for select
  using (id in (
    select tenant_id from tenant_members where user_id = auth.uid()
  ));

-- Users can view their own memberships
create policy "Users can view own memberships"
  on tenant_members for select
  using (user_id = auth.uid());
```

### TypeScript Types

```typescript
export type TenantType = 'household' | 'organization'

export interface UserProfile {
  id: string
  displayName: string | null
  email: string
  avatarUrl: string | null
  createdAt: Date
}

export interface Tenant {
  id: string
  type: TenantType
  name: string
  slug: string
  orgNumber: string | null  // Only for organizations
  billingEmail: string | null
  settings: Record<string, unknown>
  createdAt: Date
}

export interface TenantMember {
  tenantId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
}
```

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_create_identity.sql`
- `packages/database/src/types/database.ts` - Generated types
- `packages/core/src/auth/types.ts` - TypeScript interfaces
- `packages/core/src/auth/get-user-tenants.ts` - Query helper

### Patterns to Follow

- Personal users: queries filter by `user_id` directly
- Tenant users: queries filter by `tenant_id` via membership
- Module tables include `tenant_id` (nullable for personal-mode modules)
- Usage tracking supports both per-user and per-tenant

## Dependencies

- **Blocked by**: TASK-1-01 (Supabase Auth)
- **Blocks**: TASK-1-03 (Account flows), TASK-1-07 (Usage events), all module tables

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2024-11-30 | Updated: Added Personal/Household/Organization account types |
