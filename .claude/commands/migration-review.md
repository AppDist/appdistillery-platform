---
description: Review pending migrations for issues before deployment
argument-hint: [migration-file] (optional - reviews all pending if omitted)
---

# Review Migration

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-migrator agent to review migrations for issues.

### Step 1: Identify Migrations

If `$ARGUMENTS` specifies a file, review that migration.
If empty, review all migrations in `supabase/migrations/`.

### Step 2: Launch Migrator Agent

Use the Task tool to invoke seraphae-migrator:

```
Task({
  subagent_type: "seraphae-migrator",
  prompt: `Review migrations for issues: ${ARGUMENTS || 'all in supabase/migrations/'}

## Migration Review Checklist

### Safety
- [ ] No destructive operations without explicit warning (DROP, TRUNCATE)
- [ ] Data migrations handle NULL values
- [ ] Foreign key constraints don't break existing data
- [ ] Indexes don't lock large tables for too long

### RLS
- [ ] RLS enabled on ALL new tables
- [ ] Policies use correct identity pattern (shopify_customer_id, not auth.uid())
- [ ] Subquery wrapper on current_setting() calls
- [ ] No USING (true) without role restriction
- [ ] Coverage for SELECT, INSERT, UPDATE, DELETE as appropriate

### Indexes
- [ ] Foreign key columns have indexes
- [ ] Columns used in RLS policies have indexes
- [ ] Columns in frequent WHERE clauses indexed
- [ ] No duplicate indexes

### Naming
- [ ] Migration filename follows YYYYMMDDHHMMSS_description.sql
- [ ] Table names are snake_case, plural
- [ ] Index names follow idx_table_column pattern

### Phase Appropriateness
- [ ] Tables/columns match current project phase
- [ ] No Phase 2/3 features unless explicitly requested

### Common Issues to Flag
- Missing NOT NULL on required columns
- Missing DEFAULT values where appropriate
- TEXT without length consideration
- TIMESTAMP without timezone (use TIMESTAMPTZ)
- Missing updated_at trigger

Use skills: seraphae-context, seraphae-supabase

## Output Format

### Migration: [filename]

✅ **Passes**: [what's good]

⚠️ **Issues Found**:
| Severity | Issue | Line | Recommendation |
|----------|-------|------|----------------|

📋 **Recommendations**:
1. [Action items]`
})
```

### Step 3: Present Review

Show review results with recommended fixes.
