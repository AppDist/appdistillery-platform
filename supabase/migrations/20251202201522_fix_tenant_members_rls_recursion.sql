-- Migration: Fix tenant_members RLS infinite recursion
-- Created: 2025-12-02
-- Description: Fixes RLS policies on tenant_members table that caused infinite recursion
--              by self-referencing in subqueries. Uses direct auth.uid() checks and EXISTS
--              patterns to avoid circular dependencies.

-- =============================================================================
-- PROBLEM ANALYSIS
-- =============================================================================
--
-- The original policies on tenant_members had circular dependencies:
--
-- 1. users_can_view_tenant_members (line 220-226):
--    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))
--    This queries tenant_members while evaluating a policy ON tenant_members = infinite recursion
--
-- 2. admins_can_insert_members (line 229-236):
--    Similar self-referential pattern
--
-- 3. admins_can_update_members (line 239-263):
--    Multiple self-referential subqueries
--
-- 4. users_can_leave_or_admins_remove (line 266-274):
--    Self-referential pattern in DELETE policy
--
-- SOLUTION: Use direct row checks (user_id = auth.uid()) or SECURITY DEFINER
-- helper functions to break the recursion cycle.

-- =============================================================================
-- Helper Function: Check tenant membership without triggering RLS
-- This function runs with SECURITY DEFINER to bypass RLS on tenant_members
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_is_tenant_member(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.user_is_tenant_member IS
  'Check if user is a member of a tenant (SECURITY DEFINER to bypass RLS)';

-- =============================================================================
-- Helper Function: Check if user has admin/owner role in tenant
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.user_is_tenant_admin IS
  'Check if user is admin or owner of a tenant (SECURITY DEFINER to bypass RLS)';

-- =============================================================================
-- Helper Function: Check if user is owner of tenant
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_is_tenant_owner(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.user_is_tenant_owner IS
  'Check if user is owner of a tenant (SECURITY DEFINER to bypass RLS)';

-- =============================================================================
-- Drop problematic policies on tenant_members
-- =============================================================================

DROP POLICY IF EXISTS "users_can_view_tenant_members" ON public.tenant_members;
DROP POLICY IF EXISTS "users_can_view_own_memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "admins_can_insert_members" ON public.tenant_members;
DROP POLICY IF EXISTS "admins_can_update_members" ON public.tenant_members;
DROP POLICY IF EXISTS "users_can_leave_or_admins_remove" ON public.tenant_members;

-- =============================================================================
-- Recreate policies using helper functions (no recursion)
-- =============================================================================

-- Users can view other members of tenants they belong to
-- Uses SECURITY DEFINER function to avoid self-referential query
CREATE POLICY "users_can_view_tenant_members" ON public.tenant_members
  FOR SELECT TO authenticated
  USING (
    -- User can see their own memberships (direct check, no recursion)
    user_id = auth.uid()
    OR
    -- User can see other members of tenants they belong to
    public.user_is_tenant_member(tenant_id)
  );

-- Only owners/admins can add members to a tenant
CREATE POLICY "admins_can_insert_members" ON public.tenant_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_is_tenant_admin(tenant_id)
  );

-- Only owners/admins can update member roles
-- With privilege escalation protection
CREATE POLICY "admins_can_update_members" ON public.tenant_members
  FOR UPDATE TO authenticated
  USING (
    -- User must be owner or admin of the tenant
    public.user_is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    -- Prevent users from changing their own role
    user_id != auth.uid()
    AND (
      -- Non-owner roles can be set by any admin
      role IN ('admin', 'member')
      OR (
        -- Setting role to 'owner' requires the current user to be an owner
        role = 'owner'
        AND public.user_is_tenant_owner(tenant_id)
      )
    )
  );

-- Users can leave tenants (delete own membership), or owners/admins can remove members
CREATE POLICY "users_can_leave_or_admins_remove" ON public.tenant_members
  FOR DELETE TO authenticated
  USING (
    -- User can remove their own membership (leave the tenant)
    user_id = auth.uid()
    OR
    -- Admins/owners can remove other members
    public.user_is_tenant_admin(tenant_id)
  );

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON POLICY "users_can_view_tenant_members" ON public.tenant_members IS
  'Users can view their own memberships and members of tenants they belong to';

COMMENT ON POLICY "admins_can_insert_members" ON public.tenant_members IS
  'Only owners/admins can add new members to a tenant';

COMMENT ON POLICY "admins_can_update_members" ON public.tenant_members IS
  'Only owners/admins can update member roles, with privilege escalation protection';

COMMENT ON POLICY "users_can_leave_or_admins_remove" ON public.tenant_members IS
  'Users can leave tenants, or admins can remove members';
