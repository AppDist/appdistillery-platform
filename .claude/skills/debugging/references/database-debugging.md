# Database Debugging Reference

Debugging database queries, RLS policies, authentication, and performance issues.

## Contents

- Query debugging fundamentals
- RLS policy debugging
- Authentication issues
- Connection problems
- Performance optimization
- Migration debugging

## Query Debugging Fundamentals

### Always Check for Errors

```typescript
// ❌ Bad: Ignoring errors
const { data } = await supabase.from('users').select('*')
// data might be null if error occurred

// ✅ Good: Always handle errors
const { data, error } = await supabase.from('users').select('*')

if (error) {
  console.error('[DB Error]', {
    message: error.message,
    code: error.code,
    hint: error.hint,
    details: error.details,
  })
  throw error
}
```

### Error Code Reference

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 42501 | insufficient_privilege | RLS policy blocking access |
| 23505 | unique_violation | Duplicate key |
| 23503 | foreign_key_violation | Referenced row doesn't exist |
| 23502 | not_null_violation | Required field missing |
| 42P01 | undefined_table | Table doesn't exist |
| PGRST301 | JWT expired | Auth token needs refresh |

### Debugging Query Results

```typescript
// Log query details for debugging
async function debugQuery<T>(
  query: Promise<{ data: T | null; error: any }>,
  context: string
) {
  const start = Date.now()
  const { data, error } = await query
  const duration = Date.now() - start
  
  console.log(`[DB:${context}]`, {
    duration: `${duration}ms`,
    hasData: !!data,
    dataCount: Array.isArray(data) ? data.length : 'N/A',
    error: error?.message,
  })
  
  return { data, error }
}

// Usage
const { data } = await debugQuery(
  supabase.from('proposals').select('*').eq('org_id', orgId),
  'fetchProposals'
)
```

## RLS Policy Debugging

### "New row violates row-level security policy"

This is the most common database error. It means the current user cannot perform the operation.

#### Step 1: Identify the Current User

```typescript
// Check who's authenticated
const { data: { user }, error } = await supabase.auth.getUser()
console.log('Current user:', {
  id: user?.id,
  email: user?.email,
  role: user?.role,
})

// Check the session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session valid:', !!session)
```

#### Step 2: Verify the Client Type

```typescript
// Different clients have different permissions:

// 1. Anonymous client (public access)
import { createBrowserClient } from '@supabase/ssr'
const anonClient = createBrowserClient(url, anonKey)

// 2. Authenticated client (user's session)
import { createServerClient } from '@supabase/ssr'
const userClient = createServerClient(url, anonKey, { cookies })

// 3. Service role client (bypasses RLS)
import { createClient } from '@supabase/supabase-js'
const adminClient = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

#### Step 3: Test Policy in SQL

```sql
-- Simulate authenticated user
SET session ROLE authenticated;
SET request.jwt.claims TO '{"role":"authenticated","sub":"user-uuid-here"}';

-- Try the operation
SELECT * FROM proposals WHERE org_id = 'org-uuid';

-- Check what policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'proposals';

-- Reset
RESET ROLE;
```

#### Step 4: Common RLS Fixes

**Missing SELECT policy for INSERT with RETURNING:**
```typescript
// ❌ Fails if no SELECT policy
const { data } = await supabase
  .from('proposals')
  .insert({ title: 'New' })
  .select()  // Requires SELECT policy

// ✅ Works without SELECT policy
const { data } = await supabase
  .from('proposals')
  .insert({ title: 'New' })
  .select('id')  // Minimal return
```

**Policy using wrong auth function:**
```sql
-- ❌ Might not work in all contexts
CREATE POLICY "Users see own" ON proposals
FOR SELECT USING (user_id = current_user);

-- ✅ Use Supabase auth functions
CREATE POLICY "Users see own" ON proposals
FOR SELECT USING (user_id = auth.uid());
```

### RLS Testing Script

```sql
-- Test RLS as different roles

-- 1. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'proposals';

-- 2. List all policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

-- 3. Test as anonymous (no auth)
SET ROLE anon;
SELECT count(*) FROM proposals;  -- Should be 0 or public data only
RESET ROLE;

-- 4. Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"test-user-id","role":"authenticated"}';

-- Test SELECT
SELECT * FROM proposals LIMIT 5;

-- Test INSERT
INSERT INTO proposals (title, org_id, user_id) 
VALUES ('Test', 'org-id', 'test-user-id')
RETURNING id;

-- Clean up test data
DELETE FROM proposals WHERE title = 'Test';

RESET ROLE;
```

## Authentication Issues

### Session Not Found

```typescript
// Debug session state
async function debugSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('Session debug:', {
    exists: !!session,
    user: session?.user?.email,
    expiresAt: session?.expires_at,
    isExpired: session?.expires_at 
      ? new Date(session.expires_at * 1000) < new Date()
      : 'N/A',
    error: error?.message,
  })
  
  return session
}
```

### Token Refresh Issues

```typescript
// Manual refresh
const { data, error } = await supabase.auth.refreshSession()

if (error) {
  console.error('Refresh failed:', error)
  // Redirect to login
  window.location.href = '/login'
}
```

### Server-Side Auth Debugging

```typescript
// Next.js Server Component
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('[Server Auth]', {
    hasUser: !!user,
    userId: user?.id,
    error: error?.message,
    cookies: cookieStore.getAll().map(c => c.name),
  })
  
  return user
}
```

## Connection Problems

### Connection Pooling

```typescript
// For serverless environments, use connection pooling
const supabase = createClient(
  process.env.DATABASE_URL!,  // Use pooler URL
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,  // Don't persist in serverless
    },
  }
)
```

### Timeout Issues

```typescript
// Add timeout to queries
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10000)

try {
  const { data, error } = await supabase
    .from('large_table')
    .select('*')
    .abortSignal(controller.signal)
} finally {
  clearTimeout(timeout)
}
```

### Checking Connection Status

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- See what's connected
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE datname = current_database();
```

## Performance Optimization

### Query Analysis

```typescript
// Use EXPLAIN ANALYZE
const { data } = await supabase
  .from('proposals')
  .select('*')
  .eq('org_id', orgId)
  .explain({ analyze: true, verbose: true })

console.log('Query plan:', data)
// Look for: "Seq Scan" (bad) vs "Index Scan" (good)
```

### Index Recommendations

```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check existing indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'proposals';

-- Create index for common queries
CREATE INDEX idx_proposals_org_id ON proposals(org_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Composite index for common filter combinations
CREATE INDEX idx_proposals_org_status ON proposals(org_id, status);
```

### N+1 Query Detection

```typescript
// ❌ N+1 problem
const proposals = await getProposals()
for (const proposal of proposals) {
  const items = await getProposalItems(proposal.id)  // N queries!
}

// ✅ Join query
const { data } = await supabase
  .from('proposals')
  .select(`
    *,
    items:proposal_items(*)
  `)
  .eq('org_id', orgId)
```

### RLS Performance

```sql
-- ❌ Slow: Evaluates auth.uid() per row
CREATE POLICY "slow_policy" ON proposals
FOR SELECT USING (user_id = auth.uid());

-- ✅ Faster: Caches auth.uid() result
CREATE POLICY "fast_policy" ON proposals
FOR SELECT USING (user_id = (SELECT auth.uid()));
```

## Migration Debugging

### Migration Failures

```bash
# Check migration status
supabase migration list

# Reset local database
supabase db reset

# Generate migration from changes
supabase db diff -f migration_name

# Apply specific migration
supabase migration up --include-all
```

### Common Migration Issues

**Type mismatch:**
```sql
-- Check column types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposals';
```

**Foreign key issues:**
```sql
-- Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'proposals';
```

## Real-Time Subscription Debugging

```typescript
// Debug subscription status
const channel = supabase
  .channel('proposals')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'proposals' },
    (payload) => {
      console.log('[Realtime] Change:', payload)
    }
  )
  .subscribe((status, error) => {
    console.log('[Realtime] Status:', status)
    if (error) console.error('[Realtime] Error:', error)
  })

// Check channel state
setTimeout(() => {
  console.log('[Realtime] Channel state:', channel.state)
}, 1000)
```

### Realtime Not Working

```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;

-- Check which tables have realtime
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Database Debugging Checklist

When facing database issues:

- [ ] Check the exact error code and message
- [ ] Verify authentication state (user, session, token)
- [ ] Confirm using correct client (anon vs service role)
- [ ] Test query directly in SQL editor
- [ ] Check RLS policies exist and are correct
- [ ] Verify table and column names (case sensitive!)
- [ ] Check for missing foreign key references
- [ ] Review recent migration changes
- [ ] Test with service role to isolate RLS issues
- [ ] Check connection limits and pooling

## Quick Commands

```bash
supabase db reset               # Reset local database
supabase migration list         # Check migrations
pnpm db:generate                # Generate TypeScript types
```

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
SELECT auth.uid(), auth.role();
```
