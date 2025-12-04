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
  .eq('tenant_id', session.tenant.id) // Always filter by tenant_id
```

**Migrations:**
- Location: `supabase/migrations/`
- Create: `supabase migration new <name>`
- Apply: `supabase db reset` (local) or Supabase Dashboard (production)

**Never:**
- Edit schema via Supabase Dashboard (use migrations)
- Query without `tenant_id` filter (for tenant data)
- Expose `SUPABASE_SECRET_KEY` to client

---

### AI Providers (Multi-Provider Support)

**Purpose:** LLM for scope generation, proposal drafting, and other AI tasks

**Supported Providers:**
| Provider | Package | Default Model |
|----------|---------|---------------|
| Anthropic Claude | `@ai-sdk/anthropic` | claude-sonnet-4-20250514 (default) |
| OpenAI GPT | `@ai-sdk/openai` | gpt-4o |
| Google Gemini | `@ai-sdk/google` | gemini-2.0-flash |

**Configuration:**
- Default: Anthropic Claude
- Provider selection: Via `BrainTask.provider` field
- Access: Via Vercel AI SDK adapters

**Client Setup:**
```typescript
// All AI calls go through brainHandle() - NEVER import adapters directly
import { brainHandle } from '@appdistillery/core/brain'

const result = await brainHandle({
  task: 'agency.scope',
  userPrompt: 'Generate scope for client project',
  outputSchema: ScopeResultSchema,
  // Optional: override provider
  provider: 'openai', // 'anthropic' | 'openai' | 'google'
})
```

**Environment Variables:**
- `ANTHROPIC_API_KEY` - Required for Anthropic (default)
- `OPENAI_API_KEY` - Required if using OpenAI
- `GOOGLE_GENERATIVE_AI_API_KEY` - Required if using Google

**Internal Architecture:**
```typescript
// packages/core/src/brain/adapters/
├── anthropic.ts   // generateWithAnthropic()
├── openai.ts      // generateWithOpenAI()
├── google.ts      // generateWithGoogle()
└── shared.ts      // Shared utilities, provider resolution
```

**Never:**
- Import adapters directly (always use `brainHandle()`)
- Return raw AI output without validation
- Use AI in client components
- Mix providers in single request

---

### Sentry (Error Tracking)

**Purpose:** Application error monitoring and performance tracking

**Status:** Active

**Package:** `@sentry/nextjs` ^10.27.0

**Configuration:**
- Integrated via Next.js instrumentation
- Captures unhandled errors and performance metrics
- Source maps uploaded during build

**Environment Variables:**
- `SENTRY_DSN` - Sentry project DSN
- `SENTRY_AUTH_TOKEN` - For source map uploads (build time only)

**Usage:**
```typescript
// Errors are captured automatically
// For manual capture:
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error)
Sentry.captureMessage('Custom event')
```

---

## Planned Integrations

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
