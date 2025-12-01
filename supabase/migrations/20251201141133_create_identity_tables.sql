-- Migration: Create identity tables for multi-tenancy
-- Created: 2025-12-01
-- Description: Foundation tables for user profiles, tenants, and memberships
--              Supports Personal, Household, and Organization account types

-- =============================================================================
-- Utility Function: set_updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function to auto-update updated_at timestamp';

-- =============================================================================
-- Table: user_profiles
-- Extends auth.users with application-specific profile data
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary Key (references Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Data
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated At Trigger
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.user_profiles IS 'User profile data extending Supabase auth.users';
COMMENT ON COLUMN public.user_profiles.id IS 'User ID from auth.users';
COMMENT ON COLUMN public.user_profiles.display_name IS 'User display name for UI';
COMMENT ON COLUMN public.user_profiles.email IS 'User email (synced from auth.users)';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL to user avatar image';

-- =============================================================================
-- Table: tenants
-- Households and organizations (Personal users don't need a tenant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type Discriminator
  type TEXT NOT NULL CHECK (type IN ('household', 'organization')),

  -- Core Fields
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Organization-specific fields (NULL for households)
  org_number TEXT,       -- Business registration number
  billing_email TEXT,    -- Billing contact email

  -- Settings
  settings JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated At Trigger
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug
  ON public.tenants(slug);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_tenants_type
  ON public.tenants(type);

COMMENT ON TABLE public.tenants IS 'Tenants for multi-tenancy (households and organizations)';
COMMENT ON COLUMN public.tenants.type IS 'Tenant type: household or organization';
COMMENT ON COLUMN public.tenants.name IS 'Display name of the tenant';
COMMENT ON COLUMN public.tenants.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.tenants.org_number IS 'Business registration number (organizations only)';
COMMENT ON COLUMN public.tenants.billing_email IS 'Email for billing communications';
COMMENT ON COLUMN public.tenants.settings IS 'Tenant-specific settings as JSON';

-- =============================================================================
-- Table: tenant_members
-- Junction table linking users to tenants with roles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_members (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Role
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_tenant_user UNIQUE (tenant_id, user_id)
);

-- Index for user lookups (find all tenants for a user)
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id
  ON public.tenant_members(user_id);

-- Index for tenant lookups (find all members of a tenant)
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id
  ON public.tenant_members(tenant_id);

-- Composite index for membership checks
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_tenant
  ON public.tenant_members(user_id, tenant_id);

COMMENT ON TABLE public.tenant_members IS 'Membership junction table linking users to tenants';
COMMENT ON COLUMN public.tenant_members.tenant_id IS 'Reference to the tenant';
COMMENT ON COLUMN public.tenant_members.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN public.tenant_members.role IS 'Member role: owner, admin, or member';
COMMENT ON COLUMN public.tenant_members.joined_at IS 'When the user joined the tenant';

-- =============================================================================
-- Row Level Security: user_profiles
-- =============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Service role bypass (for Server Actions and admin operations)
CREATE POLICY "service_role_all_user_profiles" ON public.user_profiles
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Row Level Security: tenants
-- =============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Users can view tenants they belong to
CREATE POLICY "users_can_view_own_tenants" ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
  );

-- Only owners/admins can update tenant details
CREATE POLICY "admins_can_update_tenants" ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete tenants
CREATE POLICY "owners_can_delete_tenants" ON public.tenants
  FOR DELETE TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Authenticated users can create tenants (they become the owner)
CREATE POLICY "authenticated_can_create_tenants" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Service role bypass
CREATE POLICY "service_role_all_tenants" ON public.tenants
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Row Level Security: tenant_members
-- =============================================================================

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "users_can_view_own_memberships" ON public.tenant_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can view other members of tenants they belong to
CREATE POLICY "users_can_view_tenant_members" ON public.tenant_members
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
  );

-- Only owners/admins can add members to a tenant
CREATE POLICY "admins_can_insert_members" ON public.tenant_members
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners/admins can update member roles (with privilege escalation protection)
CREATE POLICY "admins_can_update_members" ON public.tenant_members
  FOR UPDATE TO authenticated
  USING (
    -- User must be owner or admin of the tenant
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
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
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_members
          WHERE user_id = auth.uid() AND role = 'owner'
        )
      )
    )
  );

-- Users can leave tenants (delete own membership), or owners/admins can remove members
CREATE POLICY "users_can_leave_or_admins_remove" ON public.tenant_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "service_role_all_tenant_members" ON public.tenant_members
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Trigger: Auto-create user_profiles on auth.users signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user_profile when a new auth.users record is created';

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Helper Function: Create tenant with owner membership
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  p_type TEXT,
  p_name TEXT,
  p_slug TEXT,
  p_org_number TEXT DEFAULT NULL,
  p_billing_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Input validation: check user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a tenant';
  END IF;

  -- Input validation: check type is valid
  IF p_type NOT IN ('household', 'organization') THEN
    RAISE EXCEPTION 'Invalid tenant type: %. Must be household or organization', p_type;
  END IF;

  -- Create the tenant
  INSERT INTO public.tenants (type, name, slug, org_number, billing_email)
  VALUES (p_type, p_name, p_slug, p_org_number, p_billing_email)
  RETURNING id INTO v_tenant_id;

  -- Add the current user as owner
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'owner');

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.create_tenant_with_owner IS 'Creates a tenant and automatically adds the current user as owner';

-- =============================================================================
-- Trigger: Prevent last owner removal
-- Ensures every tenant always has at least one owner
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_count INT;
BEGIN
  -- Only check if we're removing an owner or demoting an owner
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    -- Count remaining owners for this tenant
    SELECT COUNT(*) INTO v_owner_count
    FROM public.tenant_members
    WHERE tenant_id = OLD.tenant_id
      AND role = 'owner'
      AND id != OLD.id;

    IF v_owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner of a tenant. Transfer ownership first.';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
    -- Count remaining owners for this tenant (excluding the one being demoted)
    SELECT COUNT(*) INTO v_owner_count
    FROM public.tenant_members
    WHERE tenant_id = OLD.tenant_id
      AND role = 'owner'
      AND id != OLD.id;

    IF v_owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last owner of a tenant. Promote another member first.';
    END IF;
  END IF;

  -- Return the appropriate row based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

COMMENT ON FUNCTION public.prevent_last_owner_removal() IS 'Prevents deletion or demotion of the last owner of a tenant';

-- Create trigger to enforce owner protection
CREATE TRIGGER ensure_tenant_has_owner
  BEFORE UPDATE OR DELETE ON public.tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_owner_removal();

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON SCHEMA public IS 'AppDistillery Platform - Multi-tenant application schema';
