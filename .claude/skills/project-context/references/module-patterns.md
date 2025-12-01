# Module Patterns

## Critical Architecture Rules

| Never | Always |
|-------|--------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` from `@appdistillery/core/brain` |
| Write to `usage_events` directly | Use `recordUsage()` from `@appdistillery/core/ledger` |
| Edit schema in Supabase Dashboard | Create migrations via `supabase migration new` |
| Return raw JSON from AI prompts | Use `generateObject` with Zod schema |
| Duplicate Zod schemas | Import from `modules/*/schemas/` |
| Import across modules | Use Core services or events |
| Query without org_id | Always filter by `org_id` |
| Import server code in client components | Use client-safe subpath exports |

## Auth Import Pattern (TASK-1-01, TASK-1-02)

**CRITICAL:** Client components cannot import server-only code. Use the correct subpath.

**Server Components / Server Actions:**
```typescript
import {
  createServerSupabaseClient,
  getSessionContext,
  getUserTenants,
  // Types
  type UserProfile,
  type Tenant,
  type TenantMember,
  type TenantMembership,
  type TenantType,
  type MemberRole,
} from '@appdistillery/core/auth'
```

**Client Components (IMPORTANT - use client subpath):**
```typescript
// WRONG - pulls in server-only code (next/headers), will fail build
import { createBrowserSupabaseClient } from '@appdistillery/core/auth'

// CORRECT - client-safe exports only
import {
  createBrowserSupabaseClient,
  getAuthErrorMessage
} from '@appdistillery/core/auth/client'
```

**Middleware:**
```typescript
import { updateSession } from '@appdistillery/core/auth'
```

**Session Context (TASK-1-02):**
```typescript
// Returns null if not authenticated, otherwise:
// - user: UserProfile (always populated)
// - tenant: Tenant | null (null for personal users)
// - membership: TenantMember | null (null for personal users)
const session = await getSessionContext()

if (!session) {
  // Not authenticated
}

if (session.tenant) {
  // Tenant user (household or organization)
  console.log(session.tenant.type) // 'household' | 'organization'
} else {
  // Personal user (no tenant)
}
```

## Naming Conventions

### Database Tables

| Type | Pattern | Example |
|------|---------|---------|
| Core tables | `public.<entity>` | `organizations`, `usage_events`, `user_profiles` |
| Module tables | `public.<module>_<entity>` | `agency_leads`, `agency_briefs`, `agency_proposals` |

### Usage Actions

```
<module>:<domain>:<verb>
```

Examples:
- `agency:scope:generate`
- `agency:proposal:draft`
- `agency:lead:create`

### Brain Task Types

```
<module>.<task>
```

Examples:
- `agency.scope`
- `agency.proposal`

### Code Naming

| Type | Convention | Example |
|------|------------|---------|
| Zod schemas | PascalCase + Schema | `LeadIntakeSchema`, `ScopeResultSchema` |
| Types | PascalCase | `BrainTask`, `ModuleManifest` |
| Functions | camelCase | `brainHandle()`, `recordUsage()` |
| Files | kebab-case | `lead-intake.ts`, `scope-result.ts` |

## Server Action Pattern

```typescript
'use server'

import { brainHandle } from '@appdistillery/core/brain'
import { recordUsage } from '@appdistillery/core/ledger'
import { getSessionContext } from '@appdistillery/core/auth'
import { ScopeInputSchema, ScopeResultSchema } from '@/modules/agency/schemas'

export async function generateScope(input: unknown) {
  // 1. Get session context
  const session = await getSessionContext()
  if (!session) throw new Error('Unauthorized')

  // 2. Validate input
  const validated = ScopeInputSchema.parse(input)

  // 3. Call AI via brain
  const result = await brainHandle({
    task: 'agency.scope',
    input: validated,
    outputSchema: ScopeResultSchema,
  })

  // 4. Record usage
  await recordUsage({
    orgId: session.orgId,
    action: 'agency:scope:generate',
    tokens: result.usage.totalTokens,
    cost: 50, // Brain Units
  })

  // 5. Save to database with org_id
  const supabase = createServerClient(...)
  await supabase
    .from('agency_briefs')
    .insert({
      org_id: session.orgId,
      lead_id: validated.leadId,
      scope: result.output,
    })

  return result.output
}
```

## Zod Schema Pattern

```typescript
import { z } from 'zod'

// Define schema with descriptions for AI
export const ScopeResultSchema = z.object({
  deliverables: z.array(z.object({
    title: z.string().describe('Short deliverable name'),
    description: z.string().describe('What will be delivered'),
    estimatedHours: z.number().describe('Estimated hours to complete'),
  })).describe('List of project deliverables'),

  timeline: z.string().describe('Suggested project timeline'),

  assumptions: z.array(z.string()).describe('Key assumptions made'),
})

// Infer TypeScript type
export type ScopeResult = z.infer<typeof ScopeResultSchema>
```

**Key Points:**
- Use `.describe()` for AI guidance
- Export both schema and inferred type
- Single source of truth for validation

## Module Manifest Pattern

```typescript
// modules/agency/src/manifest.ts
import type { ModuleManifest } from '@appdistillery/core/modules'

export const agencyManifest: ModuleManifest = {
  id: 'agency',
  name: 'Agency Toolkit',
  description: 'AI-powered consultancy tools',
  version: '0.1.0',

  routes: [
    { path: '/agency', component: 'AgencyDashboard' },
    { path: '/agency/leads', component: 'LeadsList' },
    { path: '/agency/leads/new', component: 'LeadIntake' },
  ],

  actions: [
    { name: 'agency:scope:generate', cost: 50 },
    { name: 'agency:proposal:draft', cost: 100 },
  ],

  artifacts: [
    { type: 'brief', table: 'agency_briefs' },
    { type: 'proposal', table: 'agency_proposals' },
  ],
}
```

## Tenant Isolation Pattern

```typescript
// Always filter by org_id
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('org_id', session.orgId) // Required!

// For inserts
await supabase
  .from('agency_leads')
  .insert({
    org_id: session.orgId, // Required!
    ...leadData,
  })

// RLS provides additional protection at database level
```

## Usage Tracking Pattern

```typescript
import { recordUsage } from '@appdistillery/core/ledger'

// After any billable AI operation
await recordUsage({
  orgId: session.orgId,
  userId: session.userId,
  action: 'agency:scope:generate',
  tokens: result.usage.totalTokens,
  inputTokens: result.usage.promptTokens,
  outputTokens: result.usage.completionTokens,
  cost: 50, // Brain Units
  durationMs: result.durationMs,
  metadata: {
    leadId: input.leadId,
    model: 'claude-3-5-sonnet',
  },
})
```

## File Organization

```
modules/agency/
├── src/
│   ├── manifest.ts           # Module definition
│   ├── prompts.ts            # AI prompt templates
│   ├── schemas/
│   │   ├── intake.ts         # LeadIntakeSchema
│   │   ├── brief.ts          # BriefSchema, ScopeResultSchema
│   │   ├── proposal.ts       # ProposalResultSchema
│   │   └── index.ts          # Re-exports
│   ├── actions/
│   │   ├── leads.ts          # createLead, getLead, etc.
│   │   ├── briefs.ts         # generateScope, etc.
│   │   ├── proposals.ts      # draftProposal, etc.
│   │   └── index.ts          # Re-exports
│   ├── components/           # Module UI components
│   └── index.ts              # Public module exports
└── package.json
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Anti-Patterns to Avoid

### Wrong: Direct AI calls
```typescript
// Never do this
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic()
const response = await anthropic.messages.create(...)
```

### Correct: Use brainHandle
```typescript
const result = await brainHandle({
  task: 'agency.scope',
  input: data,
  outputSchema: ScopeResultSchema,
})
```

### Wrong: Cross-module imports
```typescript
// Never import from other modules
import { something } from '@/modules/other-module'
```

### Correct: Use Core services
```typescript
// Use shared Core services
import { brainHandle } from '@appdistillery/core/brain'
```

### Wrong: Missing org_id
```typescript
// Dangerous: no tenant isolation
await supabase.from('leads').select('*')
```

### Correct: Always filter
```typescript
await supabase.from('leads').select('*').eq('org_id', orgId)
```
