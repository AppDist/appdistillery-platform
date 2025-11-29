# Integration Registry

## Active Integrations

### Supabase (Database + Auth)

**Purpose:** PostgreSQL database, authentication, and real-time subscriptions

**Configuration:**
- Region: EU (GDPR compliance)
- Auth: Magic links + OAuth (planned)
- RLS: Enabled on all tables

**Client Setup:**
```typescript
// Server-side (with cookies)
import { createServerClient } from '@supabase/ssr'

// Client-side
import { createBrowserClient } from '@supabase/ssr'
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

**Usage Pattern:**
```typescript
// In Server Actions
const supabase = createServerClient(...)
const { data, error } = await supabase
  .from('table_name')
  .select()
  .eq('org_id', sessionContext.orgId) // Always filter by org_id
```

**Migrations:**
- Location: `supabase/migrations/`
- Create: `supabase migration new <name>`
- Apply: `supabase db reset` (local) or Supabase Dashboard (production)

**Never:**
- Edit schema via Supabase Dashboard (use migrations)
- Query without `org_id` filter
- Expose `SUPABASE_SECRET_KEY` to client

---

### Anthropic Claude (AI Provider)

**Purpose:** LLM for scope generation, proposal drafting, and other AI tasks

**Configuration:**
- Provider: Anthropic
- Model: Claude (configured via AI SDK)
- Access: Via Vercel AI SDK

**Client Setup:**
```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'

// All AI calls go through brainHandle()
const result = await brainHandle('agency.scope', input)
```

**Environment Variables:**
- `ANTHROPIC_API_KEY`

**Usage Pattern:**
```typescript
// In @appdistillery/core/brain
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function brainHandle<T>(
  task: BrainTask,
  input: unknown
): Promise<BrainResult<T>> {
  const result = await generateObject({
    model: anthropic('claude-3-5-sonnet-latest'),
    schema: task.outputSchema, // Zod schema
    prompt: task.buildPrompt(input),
  })
  return result
}
```

**Never:**
- Call Anthropic directly (always use `brainHandle()`)
- Return raw AI output without validation
- Use AI in client components

---

## Planned Integrations (Phase 3+)

### Sentry (Error Tracking)

**Purpose:** Application error monitoring and performance tracking

**Status:** Deferred to Phase 3

**Environment Variables (planned):**
- `SENTRY_DSN`

---

### PostHog (Analytics)

**Purpose:** Product analytics and user behavior tracking

**Status:** Deferred to Phase 3

**Environment Variables (planned):**
- `NEXT_PUBLIC_POSTHOG_KEY`

---

## Integration Patterns

### Server-Side Only

Most integrations should be server-side:

```typescript
// Correct: Server Action
'use server'

export async function generateScope(input: ScopeInput) {
  const result = await brainHandle('agency.scope', input)
  return result
}
```

```typescript
// Wrong: Client component
'use client'

// Never import AI or secret clients here
```

### Error Handling

```typescript
try {
  const result = await brainHandle(task, input)
  if (!result.success) {
    // Handle validation failure
  }
} catch (error) {
  // Log to Sentry when available
  console.error('Brain operation failed:', error)
  throw new Error('AI operation failed')
}
```

### Retry Logic

For external API calls:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}
```

## Adding New Integrations

1. Document in this registry
2. Add environment variables to `.env.example`
3. Add to `turbo.json` globalEnv if needed
4. Create wrapper in `@appdistillery/core` if shared
5. Update environment-vars.md
