# AppDistillery Architecture Patterns

Modular monolith architecture patterns for AppDistillery Platform.

## Architecture Overview

AppDistillery is a **modular monolith** with a Core kernel:

```
apps/web/           → Next.js 15 application (UI layer)
packages/core/      → Kernel: auth, brain, ledger, modules
packages/database/  → Migrations + generated Supabase types
packages/ui/        → Shared components (shadcn/ui)
modules/agency/     → First module (consultancy tool)
```

**Data Flow:**
```
UI → Server Action → brainHandle() → recordUsage() → Supabase
```

## Module Boundaries

### What's Allowed

```typescript
// ✅ Import from Core services
import { brainHandle } from '@appdistillery/core/brain';
import { recordUsage } from '@appdistillery/core/ledger';
import { getSessionContext } from '@appdistillery/core/auth';

// ✅ Import shared UI components
import { Button } from '@appdistillery/ui';

// ✅ Import types from module's own schemas
import { ScopeResultSchema } from './schemas';
```

### What's Forbidden

```typescript
// ❌ NEVER: Cross-module imports
import { something } from '@/modules/other-module/internal';
import { LeadSchema } from '@/modules/agency/schemas';

// ❌ NEVER: Direct database client in module code
import { createClient } from '@supabase/supabase-js';
```

## Module Structure

Each module follows this structure:

```
modules/agency/
├── src/
│   ├── manifest.ts           # Module definition (public)
│   ├── prompts.ts            # AI prompt templates (internal)
│   ├── schemas/              # Zod schemas (public types)
│   │   ├── intake.ts
│   │   ├── brief.ts
│   │   └── index.ts
│   ├── actions/              # Server Actions (public API)
│   │   ├── leads.ts
│   │   ├── briefs.ts
│   │   └── index.ts
│   └── components/           # Module UI (internal)
└── package.json
```

**Public API:** `schemas/index.ts` and `actions/index.ts`
**Internal:** Everything else (prompts, components, utilities)

## Core Kernel Services

### brainHandle() - AI Operations

All AI operations go through the Core brain service:

```typescript
import { brainHandle } from '@appdistillery/core/brain';

const result = await brainHandle({
  task: 'agency.scope',
  input: validatedInput,
  outputSchema: ScopeResultSchema,
});
```

### recordUsage() - Usage Tracking

All billable operations go through the Core ledger:

```typescript
import { recordUsage } from '@appdistillery/core/ledger';

await recordUsage({
  orgId: session.orgId,
  action: 'agency:scope:generate',
  tokens: result.usage.totalTokens,
  cost: 50,
});
```

### getSessionContext() - Authentication

```typescript
import { getSessionContext } from '@appdistillery/core/auth';

const session = await getSessionContext();
if (!session) throw new Error('Unauthorized');
```

## Tenant Isolation

Every database operation must include `org_id`:

```typescript
// ✅ CORRECT: Always filter by org_id
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('org_id', session.orgId);

// ✅ CORRECT: Include org_id in inserts
await supabase
  .from('agency_leads')
  .insert({
    org_id: session.orgId,
    ...leadData,
  });
```

RLS policies provide database-level protection, but application code must also filter.

## Cross-Module Communication

Modules communicate through:

1. **Core Services** - Shared functionality (brain, ledger, auth)
2. **Events** (future) - Async communication between modules
3. **Database References** - Store IDs, not nested data

```typescript
// ✅ Store reference to another entity
await supabase
  .from('agency_proposals')
  .insert({
    org_id: session.orgId,
    brief_id: briefId,  // Store reference
    content: proposalContent,
  });
```

## Related Documentation

For full architecture details, see:
- `.claude/skills/project-context/references/architecture-map.md`
- `.claude/skills/project-context/references/module-patterns.md`
