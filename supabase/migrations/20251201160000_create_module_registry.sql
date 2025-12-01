-- Migration: Create module registry tables
-- Created: 2025-12-01
-- Description: System catalog for available modules and tenant module installations
--              Supports modular monolith architecture with per-tenant module enablement

-- =============================================================================
-- Table: modules (System Catalog)
-- Available modules that can be installed by tenants
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.modules (
  -- Primary Key (semantic identifier)
  id TEXT PRIMARY KEY,

  -- Module Metadata
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- Availability
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.modules IS 'System catalog of available modules for the platform';
COMMENT ON COLUMN public.modules.id IS 'Unique module identifier (e.g., agency, analytics)';
COMMENT ON COLUMN public.modules.name IS 'Human-readable display name';
COMMENT ON COLUMN public.modules.description IS 'Module description for UI display';
COMMENT ON COLUMN public.modules.version IS 'Current module version (semver format)';
COMMENT ON COLUMN public.modules.is_active IS 'Whether the module is available for installation';

-- =============================================================================
-- Table: tenant_modules (Installed Modules per Tenant)
-- Junction table tracking which modules each tenant has installed
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_modules (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Module-specific configuration per tenant
  settings JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_tenant_module UNIQUE (tenant_id, module_id)
);

COMMENT ON TABLE public.tenant_modules IS 'Installed modules per tenant with configuration';
COMMENT ON COLUMN public.tenant_modules.tenant_id IS 'Reference to the tenant';
COMMENT ON COLUMN public.tenant_modules.module_id IS 'Reference to the module';
COMMENT ON COLUMN public.tenant_modules.enabled IS 'Whether module is currently enabled (can disable without uninstalling)';
COMMENT ON COLUMN public.tenant_modules.settings IS 'Module-specific configuration for this tenant';
COMMENT ON COLUMN public.tenant_modules.installed_at IS 'When the module was installed for this tenant';
COMMENT ON COLUMN public.tenant_modules.updated_at IS 'When the module installation was last modified';

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE TRIGGER set_tenant_modules_updated_at
  BEFORE UPDATE ON public.tenant_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for tenant lookups (find all modules for a tenant)
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_id
  ON public.tenant_modules(tenant_id);

-- Index for module lookups (find all tenants with a module)
CREATE INDEX IF NOT EXISTS idx_tenant_modules_module_id
  ON public.tenant_modules(module_id);

-- =============================================================================
-- Row Level Security: modules
-- =============================================================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view the module catalog
CREATE POLICY "authenticated_can_view_modules" ON public.modules
  FOR SELECT TO authenticated
  USING (true);

-- Service role bypass (for admin operations)
CREATE POLICY "service_role_all_modules" ON public.modules
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Row Level Security: tenant_modules
-- =============================================================================

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's installed modules
CREATE POLICY "users_can_view_tenant_modules" ON public.tenant_modules
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
  );

-- Only owners/admins can install modules for their tenant
-- Module must exist and be active
CREATE POLICY "admins_can_insert_tenant_modules" ON public.tenant_modules
  FOR INSERT TO authenticated
  WITH CHECK (
    -- User must be admin of the tenant
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    -- AND module must exist and be active
    AND module_id IN (
      SELECT id FROM public.modules WHERE is_active = true
    )
  );

-- Only owners/admins can update module settings/enablement
CREATE POLICY "admins_can_update_tenant_modules" ON public.tenant_modules
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners/admins can uninstall modules
CREATE POLICY "admins_can_delete_tenant_modules" ON public.tenant_modules
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role bypass (for Server Actions and admin operations)
CREATE POLICY "service_role_all_tenant_modules" ON public.tenant_modules
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Seed Data: Initial Modules
-- =============================================================================

INSERT INTO public.modules (id, name, description)
VALUES (
  'agency',
  'Agency',
  'Consultancy tools for managing leads, briefs, and proposals'
);
