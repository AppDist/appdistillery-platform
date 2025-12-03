# ADR 0003: SECURITY DEFINER Pattern for RLS

## Status
Accepted

## Date
2025-12-02

## Context
Row Level Security (RLS) policies on multi-tenant tables need to check user membership in tenants. The naive approach causes infinite recursion:

```sql
-- PROBLEM: This causes infinite recursion
CREATE POLICY "users_can_view_tenant_members" ON tenant_members
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );
```

The policy queries `tenant_members` to determine access to `tenant_members`, creating a circular dependency that crashes Postgres with "infinite recursion detected."

We considered:
1. **Direct row checks only** - `user_id = auth.uid()` works but limits access to own records only
2. **Views with SECURITY DEFINER** - Complex to maintain, adds indirection
3. **Helper functions with SECURITY DEFINER** - Clean, explicit, testable

## Decision
We will use **SECURITY DEFINER helper functions** to break RLS recursion cycles:

- **Helper functions** run with elevated privileges (`SECURITY DEFINER`)
- **Bypass RLS** when checking membership to avoid circular dependencies
- **Explicit naming** - Functions clearly indicate they bypass RLS (e.g., `user_is_tenant_member()`)
- **Minimal scope** - Only membership checks, not business logic

### Pattern: Membership Helper Functions

```sql
-- Helper function with SECURITY DEFINER (bypasses RLS)
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
```

### Pattern: Using Helper in RLS Policy

```sql
-- Policy uses helper function (no recursion)
CREATE POLICY "users_can_view_tenant_members" ON tenant_members
  FOR SELECT USING (
    user_id = auth.uid()  -- Direct check: own records
    OR
    public.user_is_tenant_member(tenant_id)  -- Helper: other members
  );
```

### Implementation Examples
- `user_is_tenant_member(tenant_id, user_id)` - Check membership
- `user_is_tenant_admin(tenant_id, user_id)` - Check admin/owner role
- `user_is_tenant_owner(tenant_id, user_id)` - Check owner role

## Consequences

### Positive
- **Prevents infinite recursion** - SECURITY DEFINER bypasses RLS during membership checks
- **Clear security boundary** - Explicit functions document privileged operations
- **Testable** - Helper functions can be unit tested independently
- **Performance** - STABLE functions can be cached within query execution
- **Defense in depth** - Application code still filters by `org_id`, RLS is secondary protection

### Negative
- **Elevated privileges** - SECURITY DEFINER functions run with elevated privileges
- **Security risk if misused** - Functions must be carefully reviewed to prevent privilege escalation
- **Function proliferation** - Need separate functions for different membership checks
- **Migration complexity** - Requires dropping and recreating policies when changing helpers

### Security Considerations
- **SET search_path = public** - Prevents schema-based attacks
- **STABLE keyword** - Indicates function doesn't modify database (allows optimization)
- **Input validation** - Functions validate inputs to prevent SQL injection
- **Audit trail** - Function usage is implicit in RLS enforcement, no direct audit log

### Risks
- **Privilege escalation** → Mitigated by careful function review and minimal scope
- **Performance overhead** → Mitigated by STABLE keyword and query planner optimization

## References
- [Postgres SECURITY DEFINER Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- `supabase/migrations/20251201141133_create_identity_tables.sql` - Initial RLS policies (before helpers)
- `supabase/migrations/20251202201522_fix_tenant_members_rls_recursion.sql` - SECURITY DEFINER helpers
- `supabase/migrations/20251203100000_fix_tenant_modules_rls_recursion.sql` - Additional helper usage
- `supabase/migrations/20251203100001_fix_usage_events_rls_recursion.sql` - Usage events RLS fix
