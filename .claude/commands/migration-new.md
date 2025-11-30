---
description: Create a new Supabase migration with proper RLS policies
argument-hint: <migration-name> [description]
---

# Create Migration

**Input:** $ARGUMENTS

---

## Instructions

You are creating a new database migration for the AppDistillery Platform.

### Step 1: Load Context

Load the supabase skill:
```
Skill("supabase")
```

### Step 2: Parse Input

Migration name: `$ARGUMENTS`

The name should be descriptive, e.g.:
- `create_organizations_table`
- `add_agency_leads_table`
- `add_index_on_org_id`

### Step 3: Determine Migration Type

**Core tables** (shared across all modules):
- `public.<entity>` - e.g., `organizations`, `usage_events`, `audit_log`

**Module tables** (specific to a module):
- `public.<module>_<entity>` - e.g., `agency_leads`, `agency_proposals`

### Step 4: Create Migration File

**Location:** `packages/database/supabase/migrations/YYYYMMDDHHMMSS_${name}.sql`

Generate timestamp:
```bash
date +%Y%m%d%H%M%S
```

### Step 5: Migration Template

```sql
-- Migration: [description]
-- Created: [timestamp]

-- ============================================
-- Table Definition
-- ============================================

CREATE TABLE IF NOT EXISTS public.[table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Domain columns here

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.[table_name]
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_[table]_org_id
  ON public.[table_name](org_id);

-- Add indexes for foreign keys and frequently queried columns

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "tenant_isolation_select" ON public.[table_name]
  FOR SELECT TO authenticated
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

CREATE POLICY "tenant_isolation_insert" ON public.[table_name]
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (auth.jwt()->>'org_id')::uuid);

CREATE POLICY "tenant_isolation_update" ON public.[table_name]
  FOR UPDATE TO authenticated
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

CREATE POLICY "tenant_isolation_delete" ON public.[table_name]
  FOR DELETE TO authenticated
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- Service role bypass (for Server Actions)
CREATE POLICY "service_role_all" ON public.[table_name]
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.[table_name] IS '[Description]';
```

### Step 6: Critical Requirements

1. **Always include `org_id`** for tenant tables
2. **Always enable RLS** on new tables
3. **Always add service_role policy** for Server Actions
4. **Always use TIMESTAMPTZ** (not TIMESTAMP)
5. **Always add `created_at` and `updated_at`**
6. **Always index `org_id`** and foreign keys

### Step 7: Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Core tables | `public.<entity>` | `organizations` |
| Module tables | `public.<module>_<entity>` | `agency_leads` |
| Columns | snake_case | `created_at` |
| Indexes | `idx_table_column` | `idx_leads_org_id` |
| Policies | Descriptive | `tenant_isolation_select` |

### Step 8: Output Format

```markdown
## Migration Created

**File:** `packages/database/supabase/migrations/YYYYMMDDHHMMSS_name.sql`

**SQL:**
[Full migration SQL]

**Verification:**
1. Run `pnpm db:reset` locally
2. Verify table creation: `\d public.[table_name]`
3. Verify RLS: `SELECT * FROM pg_policies WHERE tablename = '[table_name]'`

**Generate Types:**
```bash
pnpm db:generate
```
```

### Step 9: Apply Migration

```bash
pnpm db:reset   # Reset and apply all migrations locally
pnpm db:generate # Regenerate TypeScript types
```
