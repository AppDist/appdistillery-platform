-- Migration: Fix tenant_modules RLS recursion
-- Created: 2025-12-03
-- Description: Fixes RLS policies on tenant_modules table that use raw subqueries
--              referencing tenant_members, causing potential infinite recursion.
--              Uses SECURITY DEFINER helper functions from previous migration.

-- =============================================================================
-- PROBLEM ANALYSIS
-- =============================================================================
--
-- The original policies on tenant_modules (from 20251201160000_create_module_registry.sql)
-- have potential for circular dependencies when combined with tenant_members policies:
--
-- 1. users_can_view_tenant_modules (line 113-119):
--    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))
--    This queries tenant_members which has its own RLS policies, creating potential recursion
--
-- 2. admins_can_insert_tenant_modules (line 123-135):
--    Similar pattern with role check in subquery
--
-- 3. admins_can_update_tenant_modules (line 138-151):
--    Similar pattern in both USING and WITH CHECK
--
-- 4. admins_can_delete_tenant_modules (line 154-161):
--    Similar pattern
--
-- SOLUTION: Use the SECURITY DEFINER helper functions created in
-- 20251202201522_fix_tenant_members_rls_recursion.sql:
--   - public.user_is_tenant_member(tenant_id)
--   - public.user_is_tenant_admin(tenant_id)
-- These functions bypass RLS and break the recursion cycle.

-- =============================================================================
-- Drop existing policies on tenant_modules
-- =============================================================================

DROP POLICY IF EXISTS "users_can_view_tenant_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "admins_can_insert_tenant_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "admins_can_update_tenant_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "admins_can_delete_tenant_modules" ON public.tenant_modules;

-- Keep service_role_all_tenant_modules policy (no recursion issue)
-- DROP POLICY IF EXISTS "service_role_all_tenant_modules" ON public.tenant_modules;

-- =============================================================================
-- Recreate policies using SECURITY DEFINER helper functions
-- =============================================================================

-- Users can view their tenant's installed modules
-- Uses SECURITY DEFINER function to avoid circular dependency with tenant_members
CREATE POLICY "users_can_view_tenant_modules" ON public.tenant_modules
  FOR SELECT TO authenticated
  USING (
    public.user_is_tenant_member(tenant_id)
  );

-- Only owners/admins can install modules for their tenant
-- Module must exist and be active
CREATE POLICY "admins_can_insert_tenant_modules" ON public.tenant_modules
  FOR INSERT TO authenticated
  WITH CHECK (
    -- User must be admin of the tenant (uses SECURITY DEFINER function)
    public.user_is_tenant_admin(tenant_id)
    -- AND module must exist and be active (no recursion risk - different table)
    AND module_id IN (
      SELECT id FROM public.modules WHERE is_active = true
    )
  );

-- Only owners/admins can update module settings/enablement
CREATE POLICY "admins_can_update_tenant_modules" ON public.tenant_modules
  FOR UPDATE TO authenticated
  USING (
    public.user_is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    public.user_is_tenant_admin(tenant_id)
  );

-- Only owners/admins can uninstall modules
CREATE POLICY "admins_can_delete_tenant_modules" ON public.tenant_modules
  FOR DELETE TO authenticated
  USING (
    public.user_is_tenant_admin(tenant_id)
  );

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON POLICY "users_can_view_tenant_modules" ON public.tenant_modules IS
  'Users can view installed modules for tenants they are members of (uses SECURITY DEFINER function)';

COMMENT ON POLICY "admins_can_insert_tenant_modules" ON public.tenant_modules IS
  'Only owners/admins can install modules for their tenant';

COMMENT ON POLICY "admins_can_update_tenant_modules" ON public.tenant_modules IS
  'Only owners/admins can update module settings or enable/disable modules';

COMMENT ON POLICY "admins_can_delete_tenant_modules" ON public.tenant_modules IS
  'Only owners/admins can uninstall modules from their tenant';
