-- Migration: Fix usage_events RLS infinite recursion
-- Created: 2025-12-03
-- Task: TASK-1-17
-- Description: Fixes RLS policies on usage_events table that caused infinite recursion
--              by using subqueries against tenant_members. Uses the existing
--              user_is_tenant_member() SECURITY DEFINER function to avoid circular dependencies.

-- =============================================================================
-- PROBLEM ANALYSIS
-- =============================================================================
--
-- The original policies on usage_events had potential recursion issues:
--
-- 1. users_can_view_tenant_usage (SELECT):
--    USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
--    This queries tenant_members which has its own RLS policies = potential recursion
--
-- 2. authenticated_can_insert_usage (INSERT):
--    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
--    Same subquery pattern = potential recursion
--
-- SOLUTION: Use public.user_is_tenant_member() SECURITY DEFINER function
-- (created in 20251202201522_fix_tenant_members_rls_recursion.sql)
-- This function bypasses RLS when checking tenant membership.

-- =============================================================================
-- Drop problematic policies on usage_events
-- =============================================================================

DROP POLICY IF EXISTS "users_can_view_tenant_usage" ON public.usage_events;
DROP POLICY IF EXISTS "authenticated_can_insert_usage" ON public.usage_events;

-- =============================================================================
-- Recreate policies using helper function (no recursion)
-- =============================================================================

-- Users can view usage for tenants they belong to
-- Also allows viewing Personal mode usage (where tenant_id IS NULL and user_id matches)
CREATE POLICY "users_can_view_tenant_usage" ON public.usage_events
  FOR SELECT TO authenticated
  USING (
    -- Tenant usage: user is a member of the tenant
    -- Uses SECURITY DEFINER function to avoid RLS recursion
    (tenant_id IS NOT NULL AND public.user_is_tenant_member(tenant_id))
    OR
    -- Personal mode usage: user's own usage without a tenant
    (tenant_id IS NULL AND user_id = auth.uid())
  );

-- Authenticated users can insert their own usage events
-- Must be the authenticated user and must be a member of the tenant (if specified)
CREATE POLICY "authenticated_can_insert_usage" ON public.usage_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Personal mode: no tenant
      tenant_id IS NULL
      OR
      -- Tenant mode: user must be a member
      -- Uses SECURITY DEFINER function to avoid RLS recursion
      public.user_is_tenant_member(tenant_id)
    )
  );

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON POLICY "users_can_view_tenant_usage" ON public.usage_events IS
  'Users can view their tenant usage (via user_is_tenant_member) or their personal usage (tenant_id IS NULL)';

COMMENT ON POLICY "authenticated_can_insert_usage" ON public.usage_events IS
  'Users can insert usage for their tenant (via user_is_tenant_member) or personal usage';

-- =============================================================================
-- Verification Notes
-- =============================================================================
--
-- After applying this migration, verify:
-- 1. Tenant members can query usage_events for their tenant
-- 2. Personal users can query their personal usage (tenant_id IS NULL)
-- 3. No RLS recursion warnings in query explain plans
--
-- Test queries:
--   EXPLAIN (ANALYZE, VERBOSE) SELECT * FROM usage_events WHERE tenant_id = '<tenant-uuid>';
--   EXPLAIN (ANALYZE, VERBOSE) SELECT * FROM usage_events WHERE tenant_id IS NULL AND user_id = auth.uid();
--
