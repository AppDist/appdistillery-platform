---
id: TASK-1-17
title: Fix RLS recursion in usage_events
priority: P0-Critical
complexity: 2
module: database
status: BACKLOG
created: 2025-12-02
review-id: C2
fix-phase: 1
---

# TASK-1-17: Fix RLS Recursion in usage_events

## Description

The `usage_events` RLS policy has the same recursion issue as `tenant_modules`. The SELECT policy uses a subquery against `tenant_members` which can cause infinite recursion during policy evaluation.

## Acceptance Criteria

- [ ] Given a tenant member, when querying usage_events, then events for their tenant are returned
- [ ] Given a personal user, when querying usage_events, then only their personal usage is returned
- [ ] No RLS recursion warnings/errors in query explain plans
- [ ] Both SELECT and INSERT policies updated

## Technical Notes

### Current Problem

```sql
-- Current (lines 86-96 in 20251202131205_create_usage_events.sql)
CREATE POLICY "users_can_view_tenant_usage" ON public.usage_events
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
    OR (tenant_id IS NULL AND user_id = auth.uid())
  );
```

### Solution

Use `public.user_is_tenant_member(tenant_id)` helper for tenant check while keeping direct `user_id = auth.uid()` for personal mode.

### Files to Create/Modify

- `supabase/migrations/YYYYMMDDHHMMSS_fix_usage_events_rls_recursion.sql` - New migration

### Patterns to Follow

- Use `public.user_is_tenant_member(tenant_id)` helper function
- Keep personal mode check: `tenant_id IS NULL AND user_id = auth.uid()`
- Update both SELECT and INSERT policies

## Implementation Agent

- **Implement**: `database-architect`
- **Review**: `security-auditor`, `code-reviewer`

## Execution

- **Mode**: Parallel with C1, C3, H8, L4
- **Phase**: Fix Phase 1 (Security & RLS)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding C2 |
