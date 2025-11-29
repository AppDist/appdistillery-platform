---
description: Create a new Supabase migration with proper RLS policies
argument-hint: <migration-name> [description]
---

# Create Migration

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-migrator agent to create a new database migration.

### Step 1: Parse Input

Migration name: `$ARGUMENTS`

The name should be descriptive, e.g.:
- `create_profiles_table`
- `add_rewards_ledger`
- `add_index_on_email`

### Step 2: Launch Migrator Agent

Use the Task tool to invoke seraphae-migrator:

```
Task({
  subagent_type: "seraphae-migrator",
  prompt: `Create a new Supabase migration: ${ARGUMENTS}

## Migration Requirements

### File Location
supabase/migrations/YYYYMMDDHHMMSS_${ARGUMENTS}.sql

### Required Elements

1. **Schema changes** (tables, columns, constraints)
2. **RLS enablement** - ALWAYS enable RLS on new tables
3. **RLS policies** - Using Seraphaé identity pattern:
   \`\`\`sql
   CREATE POLICY "policy_name" ON table_name
     FOR SELECT
     TO authenticated
     USING (
       shopify_customer_id = (SELECT current_setting('app.current_shopify_customer_id', true))
     );
   \`\`\`
4. **Indexes** - On foreign keys, policy columns, frequently queried columns

### Critical Context
- NO Supabase Auth - use shopify_customer_id as identity
- Service role bypasses RLS (used in Server Actions)
- Always use (SELECT current_setting(..., true)) with subquery wrapper

### Naming Convention
- Tables: snake_case, plural (profiles, rewards_ledger)
- Columns: snake_case
- Indexes: idx_tablename_columnname
- Policies: descriptive, e.g., "Users can view own profile"

### Phase Awareness
Current phase: Phase 1 (Core Commerce)
- profiles table exists
- rewards_ledger is Phase 2

If requested table is Phase 2+, confirm before creating.

Use skills: seraphae-context, seraphae-supabase

## Output Format

📁 Migration: supabase/migrations/YYYYMMDDHHMMSS_name.sql

📝 SQL:
\`\`\`sql
-- Full migration SQL with comments
\`\`\`

✅ Verification:
1. Run \`supabase db reset\` locally
2. Verify table/policy creation
3. Test RLS with session variable

↩️ Rollback (forward-fix):
\`\`\`sql
-- SQL to undo if needed
\`\`\``
})
```

### Step 3: Review and Apply

Review the generated migration before running:
```bash
supabase db reset  # Test locally
supabase db push   # Push to remote (when ready)
```
