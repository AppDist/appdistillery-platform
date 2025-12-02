-- Migration: Create usage_events table for AI usage tracking
-- Created: 2025-12-02
-- Description: Tracks AI usage and billable actions per tenant
--              Supports both tenant-scoped and Personal mode (NULL tenant_id) usage

-- =============================================================================
-- Table: usage_events
-- Records all AI usage and billable actions for billing and analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant Isolation (NULLABLE: users can work in "Personal" mode without a tenant)
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- User who performed the action
  -- FK to auth.users (not user_profiles) intentionally preserves usage data
  -- after user profile deletion via ON DELETE SET NULL
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action Identification
  action TEXT NOT NULL,                -- e.g., 'agency:scope:generate'
  module_id TEXT,                      -- e.g., 'agency'

  -- Token Tracking
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  tokens_total INT GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,

  -- Billing
  units INT NOT NULL DEFAULT 0,        -- Brain Units for billing

  -- Performance Metrics
  duration_ms INT,                     -- Request duration in milliseconds

  -- Additional Context
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamp (no updated_at - events are immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.usage_events IS 'AI usage and billable action tracking for billing and analytics';
COMMENT ON COLUMN public.usage_events.tenant_id IS 'Tenant ID for tenant isolation (NULL for Personal mode usage)';
COMMENT ON COLUMN public.usage_events.user_id IS 'User who performed the action. FK to auth.users (not user_profiles) to preserve usage data after profile deletion via ON DELETE SET NULL.';
COMMENT ON COLUMN public.usage_events.action IS 'Action identifier in format module:domain:verb (e.g., agency:scope:generate)';
COMMENT ON COLUMN public.usage_events.module_id IS 'Module that generated the usage (e.g., agency)';
COMMENT ON COLUMN public.usage_events.tokens_input IS 'Number of input tokens consumed';
COMMENT ON COLUMN public.usage_events.tokens_output IS 'Number of output tokens generated';
COMMENT ON COLUMN public.usage_events.tokens_total IS 'Total tokens (computed: input + output)';
COMMENT ON COLUMN public.usage_events.units IS 'Brain Units consumed for billing purposes';
COMMENT ON COLUMN public.usage_events.duration_ms IS 'Request duration in milliseconds for performance tracking';
COMMENT ON COLUMN public.usage_events.metadata IS 'Additional context (model, cost, etc.)';
COMMENT ON COLUMN public.usage_events.created_at IS 'When the usage event occurred';

-- =============================================================================
-- Indexes
-- =============================================================================

-- Primary query pattern: usage by tenant over time
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created
  ON public.usage_events(tenant_id, created_at DESC);

-- Query by action type (for analytics)
CREATE INDEX IF NOT EXISTS idx_usage_events_action
  ON public.usage_events(action);

-- Query by user (for personal usage tracking)
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id
  ON public.usage_events(user_id);

-- Query by module (for module-level analytics)
CREATE INDEX IF NOT EXISTS idx_usage_events_module_id
  ON public.usage_events(module_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Users can view usage for tenants they belong to
-- Also allows viewing Personal mode usage (where tenant_id IS NULL and user_id matches)
CREATE POLICY "users_can_view_tenant_usage" ON public.usage_events
  FOR SELECT TO authenticated
  USING (
    -- Tenant usage: user is a member of the tenant
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
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
      tenant_id IS NULL
      OR tenant_id IN (
        SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
      )
    )
  );

-- Service role bypass (for Server Actions and admin operations)
-- This is the primary insertion method via recordUsage()
CREATE POLICY "service_role_all_usage_events" ON public.usage_events
  FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- Documentation
-- =============================================================================

-- Note: No UPDATE or DELETE policies for authenticated users
-- Usage events are immutable audit records
-- Only service_role can modify/delete for administrative purposes
