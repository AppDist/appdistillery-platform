---
description: Review pending migrations for issues before deployment
argument-hint: [migration-file] (optional - reviews all pending if omitted)
---

# Review Migration

**Input:** $ARGUMENTS

---

## Instructions

You are reviewing database migrations for the AppDistillery Platform.

### Step 1: Load Context

Load the supabase skill:
```
Skill("supabase")
```

### Step 2: Identify Migrations

If `$ARGUMENTS` specifies a file, review that migration.
If empty, review all migrations in `packages/database/supabase/migrations/`.

```bash
ls -la packages/database/supabase/migrations/
```

### Step 3: Review Checklist

#### Safety
- [ ] No destructive operations without explicit warning (DROP, TRUNCATE)
- [ ] Data migrations handle NULL values
- [ ] Foreign key constraints don't break existing data
- [ ] Indexes don't lock large tables for too long

#### Tenant Isolation
- [ ] All tenant tables have `org_id` column
- [ ] `org_id` references `organizations(id)` with ON DELETE CASCADE
- [ ] RLS enabled on ALL new tables
- [ ] Tenant policies use `org_id = (auth.jwt()->>'org_id')::uuid`
- [ ] Service role bypass policy exists

#### RLS Policy Coverage
- [ ] SELECT policy for reads
- [ ] INSERT policy with WITH CHECK
- [ ] UPDATE policy for modifications
- [ ] DELETE policy if deletions allowed
- [ ] No `USING (true)` without role restriction

#### Indexes
- [ ] `org_id` column has index
- [ ] Foreign key columns have indexes
- [ ] Columns in frequent WHERE clauses indexed
- [ ] No duplicate indexes

#### Naming
- [ ] Migration filename follows `YYYYMMDDHHMMSS_description.sql`
- [ ] Core tables: `public.<entity>`
- [ ] Module tables: `public.<module>_<entity>`
- [ ] Index names follow `idx_table_column` pattern

#### Data Types
- [ ] Use `TIMESTAMPTZ` (not TIMESTAMP)
- [ ] Use `UUID` for IDs
- [ ] Use `TEXT` appropriately (or VARCHAR with limit)
- [ ] Use `NUMERIC` for money (not FLOAT)

#### Common Issues to Flag
- Missing `NOT NULL` on required columns
- Missing `DEFAULT` values where appropriate
- Missing `updated_at` trigger
- Missing table comments
- Hardcoded values that should be configurable

### Step 4: Search for Issues

```bash
# Check for missing RLS
rg "CREATE TABLE" packages/database/supabase/migrations/ | xargs -I{} sh -c 'grep -L "ENABLE ROW LEVEL SECURITY" {}'

# Check for TIMESTAMP without timezone
rg "TIMESTAMP\s+NOT\s+NULL" --type sql packages/database/supabase/migrations/

# Check for missing org_id
rg "CREATE TABLE" packages/database/supabase/migrations/ | xargs -I{} sh -c 'grep -L "org_id" {}'
```

### Step 5: Output Format

```markdown
## Migration Review: [filename]

### Summary
- **Status:** [PASS / NEEDS CHANGES]
- **Tables:** [list of tables affected]

### Passes
- [What's correct and well-done]

### Issues Found

| Severity | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| Critical | [issue] | [line] | [fix] |
| Warning | [issue] | [line] | [fix] |

### Recommendations
1. [Prioritized action items]
2. [Next action item]
```

### Step 6: Present Review

Show review results with specific line numbers and recommended fixes.

Offer to apply critical fixes immediately.
