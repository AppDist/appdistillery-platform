---
name: supabase
description: Comprehensive Supabase integration for Python and JavaScript/TypeScript projects. Use when working with Supabase database queries, authentication (email/password, magic links, OAuth, SSR), realtime subscriptions, storage, edge functions, or RPC calls. Includes support for both client-side and server-side rendering patterns. (project)
---

# Supabase Integration for AppDistillery

Supabase integration patterns optimized for AppDistillery's modular monolith architecture with multi-tenant isolation.

## AppDistillery Context

**Architecture:** Modular monolith with Turborepo
**Database:** Supabase (Postgres, EU region) with RLS
**Framework:** Next.js 15 (App Router)
**Auth:** Supabase Auth with SSR via `@supabase/ssr`

### Critical Rules

| Never | Always |
|-------|--------|
| Edit schema in Supabase Dashboard | Create migrations via `supabase migration new` |
| Query without `org_id` filter | Include tenant isolation in every query |
| Use `getSession()` for auth checks | Use `getUser()` (validates JWT) |
| Expose service role key | Use anon key in client code |

## Project Structure

```
appdistillery/
├── packages/database/          # Migrations + generated types
│   ├── src/
│   │   └── types.ts           # Generated Supabase types
│   └── package.json
├── supabase/
│   ├── config.toml            # Local dev config
│   └── migrations/            # SQL migration files
└── apps/web/
    └── lib/supabase/
        ├── client.ts          # Browser client
        ├── server.ts          # Server component client
        └── middleware.ts      # Middleware client
```

## Client Setup (Next.js 15)

### Browser Client

```typescript
// apps/web/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@appdistillery/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client

```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@appdistillery/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie setting can fail in Server Components
          }
        },
      },
    }
  )
}
```

## Multi-Tenant Queries

**Every query MUST include `org_id` filter for tenant isolation.**

### Canonical Pattern: Server Action

```typescript
// modules/agency/actions/briefs.ts
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { getSessionContext } from '@appdistillery/core/auth';
import { createClient } from '@/lib/supabase/server';
import { ScopeResultSchema } from '../schemas/brief';

export async function generateScope(briefId: string) {
  // 1. Get session context (includes org)
  const { org } = await getSessionContext();
  const supabase = await createClient();

  // 2. Fetch data with org_id filter (REQUIRED)
  const { data: brief } = await supabase
    .from('agency_briefs')
    .select('*')
    .eq('id', briefId)
    .eq('org_id', org.id)  // Always filter by org!
    .single();

  if (!brief) throw new Error('Brief not found');

  // 3. Call Brain with Zod schema
  const result = await brainHandle({
    orgId: org.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    schema: ScopeResultSchema,
    systemPrompt: SCOPING_SYSTEM_PROMPT,
    userPrompt: SCOPING_USER_TEMPLATE({ brief }),
  });

  if (!result.success) throw new Error(result.error);

  // 4. Update database (org_id already validated)
  await supabase
    .from('agency_briefs')
    .update({ ai_analysis: result.data, status: 'analyzed' })
    .eq('id', briefId);

  return result.data;
}
```

### Query Patterns

```typescript
// SELECT with org isolation
const { data, error } = await supabase
  .from('agency_leads')
  .select('id, name, email, status')
  .eq('org_id', org.id)
  .order('created_at', { ascending: false });

// INSERT (org_id required)
const { data, error } = await supabase
  .from('agency_leads')
  .insert({
    org_id: org.id,  // Always include!
    name: 'New Lead',
    email: 'lead@example.com',
  })
  .select()
  .single();

// UPDATE with org isolation
const { data, error } = await supabase
  .from('agency_leads')
  .update({ status: 'contacted' })
  .eq('id', leadId)
  .eq('org_id', org.id);  // Prevent cross-tenant updates

// DELETE with org isolation
const { error } = await supabase
  .from('agency_leads')
  .delete()
  .eq('id', leadId)
  .eq('org_id', org.id);  // Prevent cross-tenant deletes
```

## Database Migrations

**Never use Supabase Dashboard Table Editor.**

```bash
# Create new migration
supabase migration new add_agency_leads_table

# Apply locally
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > packages/database/src/types.ts
```

### Migration Template

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_agency_leads_table.sql

-- Create table with org_id for tenant isolation
CREATE TABLE public.agency_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: org isolation
CREATE POLICY "org_isolation" ON public.agency_leads
  FOR ALL USING (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
  );

-- Index for performance
CREATE INDEX idx_agency_leads_org_id ON public.agency_leads(org_id);
```

## RLS Policy Pattern

```sql
-- Standard org isolation policy
CREATE POLICY "org_isolation" ON public.table_name
  FOR ALL USING (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
  );
```

## Table Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Core tables | `public.<entity>` | `organizations`, `memberships`, `usage_events` |
| Module tables | `public.<module>_<entity>` | `agency_leads`, `agency_briefs` |

## Authentication

### Server-Side Auth Check

```typescript
// In Server Components or Server Actions
import { createClient } from '@/lib/supabase/server';

export async function protectedAction() {
  const supabase = await createClient();

  // ALWAYS use getUser() - validates JWT with auth server
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Proceed with authenticated user
}
```

### Middleware Session Refresh

```typescript
// apps/web/middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Common Workflows

### Data with Related Records

```typescript
// Fetch lead with related briefs
const { data } = await supabase
  .from('agency_leads')
  .select(`
    id,
    name,
    email,
    agency_briefs (
      id,
      status,
      created_at
    )
  `)
  .eq('org_id', org.id)
  .single();
```

### Upsert Pattern

```typescript
const { data, error } = await supabase
  .from('agency_leads')
  .upsert({
    id: existingId,  // If exists, updates; otherwise inserts
    org_id: org.id,
    name: 'Updated Name',
  })
  .select()
  .single();
```

### Count Query

```typescript
const { count, error } = await supabase
  .from('agency_leads')
  .select('*', { count: 'exact', head: true })
  .eq('org_id', org.id)
  .eq('status', 'new');
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('agency_leads')
  .select()
  .eq('org_id', org.id);

if (error) {
  // Log for debugging
  console.error('Supabase error:', error.message, error.code);

  // Handle specific errors
  if (error.code === 'PGRST116') {
    throw new Error('Record not found');
  }

  throw new Error('Database operation failed');
}
```

## Checklist Before Committing

- [ ] All queries include `org_id` filter
- [ ] RLS policies exist on new tables
- [ ] Migration file created (not Dashboard edits)
- [ ] Types regenerated after schema changes
- [ ] Using `getUser()` not `getSession()` for auth

## References

- [Authentication Patterns](references/authentication.md)
- [Database Queries](references/database-queries.md)
- [SSR Patterns](references/ssr-patterns.md)
- [Security Best Practices](references/security.md)
- [Realtime Subscriptions](references/realtime.md)
- [Storage Operations](references/storage.md)
- [Edge Functions](references/edge-functions.md)

## Related Skills

- See `code-quality` for coding standards
- See `debugging` for troubleshooting patterns
- See `testing` for database test strategies
