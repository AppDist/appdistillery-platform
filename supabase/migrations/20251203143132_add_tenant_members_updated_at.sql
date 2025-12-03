-- Migration: Add updated_at column to tenant_members table
-- Created: 2025-12-03
-- Task: TASK-1-20
-- Description: Add updated_at column with auto-update trigger for audit trail purposes.
--              The set_updated_at() function already exists from 20251201141133_create_identity_tables.sql

-- =============================================================================
-- Add updated_at Column
-- =============================================================================

-- Add column with default value (populates existing rows with current timestamp)
ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- Add Updated At Trigger
-- =============================================================================

-- Create trigger to automatically update the timestamp on row modification
-- Uses existing set_updated_at() function from identity tables migration
CREATE TRIGGER set_tenant_members_updated_at
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON COLUMN public.tenant_members.updated_at IS 'Timestamp of last modification for audit trail';
