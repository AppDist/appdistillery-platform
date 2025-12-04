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
| Query without tenant_id/user_id | Always filter by `tenant_id` and/or `user_id` |
| Import server code in client components | Use client-safe subpath exports |
| Check module access manually | Use `isModuleEnabled()` from `@appdistillery/core/modules` |

## Auth Import Pattern (TASK-1-01, TASK-1-02)

**CRITICAL:** Client components cannot import server-only code. Use the correct subpath.

**Server Components / Server Actions:**
```typescript
import {
  createServerSupabaseClient,
  getSessionContext,
  getUserTenants,
  getActiveTenant,
  switchTenant,
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
| Core tables | `public.<entity>` | `tenants`, `usage_events`, `user_profiles` |
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

**CRITICAL:** Use `getCachedSessionContext()` for better performance (see ADR-008).

```typescript
'use server'

import { brainHandle } from '@appdistillery/core/brain'
import { recordUsage } from '@appdistillery/core/ledger'
import { getCachedSessionContext } from '@appdistillery/core/auth'
import { logger, ErrorCodes, getErrorMessage, createErrorResult } from '@appdistillery/core'
import { ScopeInputSchema, ScopeResultSchema } from '@/modules/agency/schemas'

export async function generateScope(input: unknown) {
  // 1. Get cached session context (30s TTL)
  const session = await getCachedSessionContext()
  if (!session) {
    return createErrorResult(ErrorCodes.UNAUTHORIZED)
  }

  // 2. Validate input
  const validated = ScopeInputSchema.parse(input)

  // 3. Call AI via brain
  const result = await brainHandle({
    task: 'agency.scope',
    input: validated,
    outputSchema: ScopeResultSchema,
  })

  if (!result.success) {
    logger.error('generateScope', 'AI generation failed', { error: result.error })
    return createErrorResult(ErrorCodes.AI_GENERATION_FAILED)
  }

  // 4. Record usage (brainHandle does this automatically, but shown for clarity)
  const usageResult = await recordUsage({
    action: 'agency:scope:generate',
    tenantId: session.tenant?.id,
    userId: session.user.id,
    moduleId: 'agency',
    tokensInput: result.usage.promptTokens,
    tokensOutput: result.usage.completionTokens,
    units: 50, // Brain Units
    durationMs: result.durationMs,
  })

  if (!usageResult.success) {
    logger.error('generateScope', 'Failed to record usage', { error: usageResult.error })
  }

  // 5. Save to database with tenant_id and user_id
  const supabase = createServerClient(...)
  await supabase
    .from('agency_briefs')
    .insert({
      tenant_id: session.tenant?.id,
      user_id: session.user.id,
      lead_id: validated.leadId,
      scope: result.output,
    })

  return { success: true, data: result.output }
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
    { path: '/agency', icon: 'Users', label: 'Dashboard' },
    { path: '/agency/leads', icon: 'FileText', label: 'Leads' },
  ],

  usageActions: [
    'agency:scope:generate',
    'agency:proposal:draft',
  ],
}
```

## Module Registry Pattern (TASK-1-06)

Use `@appdistillery/core/modules` for module installation and access checks:

### Checking Module Access

```typescript
import { isModuleEnabled } from '@appdistillery/core/modules'

// Check if a module is enabled for the current tenant
const session = await getSessionContext()
if (!session?.tenant) throw new Error('No active tenant')

const hasAgency = await isModuleEnabled(session.tenant.id, 'agency')
if (!hasAgency) {
  return { success: false, error: 'Agency module not enabled' }
}
```

### Getting Installed Modules

```typescript
import { getInstalledModules } from '@appdistillery/core/modules'

// Get all enabled modules for current tenant
const session = await getSessionContext()
if (!session?.tenant) throw new Error('No active tenant')

const modules = await getInstalledModules(session.tenant.id)
// Returns: InstalledModule[] with module metadata and settings

// Include disabled modules
const allModules = await getInstalledModules(session.tenant.id, {
  includeDisabled: true
})
```

### Installing Modules (Admin Only)

```typescript
'use client'
import { installModule } from '@appdistillery/core/modules'

async function handleInstall() {
  const result = await installModule({
    moduleId: 'agency',
    settings: { featureFlags: { proposals: true } }
  })

  if (result.success) {
    console.log('Module installed:', result.data.moduleId)
  } else {
    console.error('Failed:', result.error)
  }
}
```

### Uninstalling Modules (Admin Only)

```typescript
'use client'
import { uninstallModule } from '@appdistillery/core/modules'

async function handleUninstall() {
  // Soft delete (disable only)
  const result = await uninstallModule({
    moduleId: 'agency',
    hardDelete: false
  })

  if (result.success) {
    console.log('Module uninstalled')
  } else {
    console.error('Failed:', result.error)
  }
}
```

**Key Points:**
- `isModuleEnabled()` checks if a module is installed and enabled
- `getInstalledModules()` returns all installed modules with metadata
- `installModule()` requires admin role (owner or admin)
- `uninstallModule()` supports soft delete (disable) or hard delete (remove)
- All operations are tenant-scoped automatically

## Tenant Isolation Pattern

```typescript
// Personal user: filter by user_id, tenant_id IS NULL
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('user_id', session.user.id)
  .is('tenant_id', null)

// Tenant user: filter by tenant_id
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('tenant_id', session.tenant.id)

// For inserts (works for both personal and tenant)
await supabase
  .from('agency_leads')
  .insert({
    tenant_id: session.tenant?.id, // null for personal users
    user_id: session.user.id,      // Always required
    ...leadData,
  })

// RLS provides additional protection at database level
```

## Usage Tracking Pattern (TASK-1-08)

**CRITICAL:** Always use `recordUsage()` after AI operations. Never write to `usage_events` table directly.

```typescript
import { recordUsage } from '@appdistillery/core/ledger'
import type { RecordUsageInput } from '@appdistillery/core/ledger'

// After any billable AI operation
const result = await recordUsage({
  action: 'agency:scope:generate',     // Required: module:domain:verb
  tenantId: session.tenant?.id,        // Optional: null for personal users
  userId: session.user.id,             // Optional: tracks user who triggered
  moduleId: 'agency',                  // Optional: module that triggered
  tokensInput: result.usage.promptTokens,    // Optional: default 0
  tokensOutput: result.usage.completionTokens, // Optional: default 0
  units: 50,                           // Optional: Brain Units cost, default 0
  durationMs: result.durationMs,       // Optional: operation duration
  metadata: {                          // Optional: JSON object
    leadId: input.leadId,
    model: 'claude-3-5-sonnet',
  },
})

// Result is discriminated union
if (result.success) {
  console.log('Usage recorded:', result.data.id)
  console.log('Total tokens:', result.data.tokensTotal)
} else {
  console.error('Failed to record usage:', result.error)
}
```

**Key Points:**
- `action` must follow format: `module:domain:verb` (validated with regex)
- `tenantId` is nullable for Personal mode (users without active tenant)
- Uses service role client to bypass RLS (system operation)
- Returns discriminated union: `{ success: true, data }` or `{ success: false, error }`
- `tokensTotal` is computed column (tokens_input + tokens_output)

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

## Logging Pattern

**CRITICAL:** Use structured logging instead of `console.error`.

```typescript
import { logger } from '@appdistillery/core'

// Context identifies the module/function
logger.error('brainHandle', 'Failed to generate', { error, taskId })
logger.warn('auth', 'Session near expiry', { userId, expiresAt })
logger.info('modules', 'Module installed', { moduleId, tenantId })
logger.debug('cache', 'Cache hit', { key, ttl })
```

**Format:** `[context] message { data }`

**Levels:**
- `error` - Operation failed, needs attention
- `warn` - Degraded but continuing
- `info` - Significant events
- `debug` - Development/troubleshooting

## Error Codes Pattern

**CRITICAL:** Use standardized error codes for user-facing errors.

```typescript
import { ErrorCodes, getErrorMessage, createErrorResult } from '@appdistillery/core'

// Available codes
ErrorCodes.UNAUTHORIZED
ErrorCodes.FORBIDDEN
ErrorCodes.NOT_FOUND
ErrorCodes.RATE_LIMIT_EXCEEDED
ErrorCodes.INVALID_PROMPT
ErrorCodes.AI_GENERATION_FAILED
ErrorCodes.DATABASE_ERROR
ErrorCodes.VALIDATION_ERROR

// Get user-friendly message
const message = getErrorMessage(ErrorCodes.RATE_LIMIT_EXCEEDED)
// "You've exceeded the rate limit. Please try again later."

// Create standardized error result
return createErrorResult(ErrorCodes.UNAUTHORIZED)
// { success: false, error: "You are not authorized to perform this action." }

// With additional details
return createErrorResult(ErrorCodes.VALIDATION_ERROR, 'Email format invalid')
// { success: false, error: "The provided data is invalid. Email format invalid" }
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

### Wrong: Missing tenant_id/user_id
```typescript
// Dangerous: no tenant isolation
await supabase.from('leads').select('*')
```

### Correct: Always filter
```typescript
// For personal users
await supabase
  .from('leads')
  .select('*')
  .eq('user_id', userId)
  .is('tenant_id', null)

// For tenant users
await supabase
  .from('leads')
  .select('*')
  .eq('tenant_id', tenantId)
```
