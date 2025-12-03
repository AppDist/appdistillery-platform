---
id: TASK-1-16
title: Fix RLS recursion in tenant_modules
priority: P0-Critical
complexity: 2
module: database
status: BACKLOG
created: 2025-12-02
review-id: C1
fix-phase: 1
---

# TASK-1-16: Fix RLS Recursion in tenant_modules

## Description

The `tenant_modules` table RLS policies use raw subqueries that reference `tenant_members`, which can cause infinite recursion during policy evaluation. Apply the same `SECURITY DEFINER` helper function pattern used in `20251202201522_fix_tenant_members_rls_recursion.sql`.

## Acceptance Criteria

- [ ] Given a user with membership in multiple tenants, when they query `tenant_modules`, then all installed modules for their tenants are returned without query failure
- [ ] Given a user without tenant membership, when they query `tenant_modules`, then they receive an empty result (not an error)
- [ ] No `infinite recursion` errors in Supabase logs during RLS policy evaluation
- [ ] Migration file follows project naming convention

## Technical Notes

### Current Problem

```sql
-- Current (potential recursion risk)
CREATE POLICY "users_can_view_tenant_modules" ON public.tenant_modules
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
  );
```

### Solution

Use the existing `public.user_is_tenant_member(tenant_id)` helper function that uses `SECURITY DEFINER` to avoid recursion.

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_fix_tenant_modules_rls_recursion.sql` - New migration

### Patterns to Follow

- Follow pattern from `20251202201522_fix_tenant_members_rls_recursion.sql`
- Use `public.user_is_tenant_member(tenant_id)` helper function
- Drop existing policies before recreating

## Implementation Agent

- **Implement**: `database-architect`
- **Review**: `security-auditor`, `code-reviewer`

## Execution

- **Mode**: Parallel with C2, C3, H8, L4
- **Phase**: Fix Phase 1 (Security & RLS)

## Dependencies

- **Blocked by**: None
- **Blocks**: TASK-1-27 (Module registry tests need working RLS)

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding C1 |
