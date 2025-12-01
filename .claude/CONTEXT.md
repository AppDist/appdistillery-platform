# AppDistillery — Claude Code Context v1.1

> Paste this at the start of every Claude Code / Cursor session.

## Project Overview

**AppDistillery** is a modular micro-SaaS platform where users subscribe to individual modules on top of a shared Core. v0.1 focuses on building the Core Kernel + Agency Module (consultancy tool).

## Architecture

```
appdistillery/
├── apps/web/                 # Next.js 15 (App Router)
├── packages/
│   ├── core/                 # Kernel: auth, brain, ledger, modules
│   ├── database/             # Migrations + generated types
│   └── ui/                   # Shared components
└── modules/
    └── agency/               # First module: consultancy
        ├── schemas/          # Zod schemas (SHARED by UI + actions)
        ├── actions/          # Server actions
        └── prompts.ts        # AI prompt templates
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Database:** Supabase (Postgres, EU) with RLS
- **AI:** Vercel AI SDK + Anthropic (`generateObject` for structured output)
- **Validation:** Zod (shared schemas)
- **Testing:** Vitest
- **Deploy:** Vercel

---

## ⚠️ NEVER DO THIS

These are hard rules. Violating them breaks the architecture:

| ❌ Never | ✅ Always |
|----------|-----------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` from Core |
| Write directly to `usage_events` | Use `recordUsage()` from Core |
| Edit DB schema in Supabase Dashboard | Generate migrations with CLI |
| Return raw JSON from prompts | Use `generateObject` with Zod schema |
| Duplicate Zod schemas | Import from `modules/*/schemas/` |
| Import across modules | Use Core services or events |

---

## Core Services

### Brain Router (`packages/core/brain`)
```typescript
import { brainHandle } from '@appdistillery/core/brain';

const result = await brainHandle({
  tenantId?: string,          // Optional - null for personal users
  userId: string,
  moduleId: string,
  taskType: string,           // e.g., 'agency.scope'
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema,          // Guarantees valid JSON output
});
// result.data is typed to your schema
```

### Usage Ledger (`packages/core/ledger`)
```typescript
import { recordUsage } from '@appdistillery/core/ledger';

await recordUsage({
  tenantId?: string,          // Optional - null for personal users
  userId: string,
  moduleId: string,
  action: string,             // e.g., 'agency:scope:generate'
  units: number,
  tokens?: number,
  durationMs?: number,
});
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Core tables** | `public.<entity>` | `tenants`, `usage_events`, `user_profiles` |
| **Module tables** | `public.<module>_<entity>` | `agency_leads`, `agency_briefs` |
| **Usage actions** | `<module>:<domain>:<verb>` | `agency:scope:generate` |
| **Brain task types** | `<module>.<task>` | `agency.scope`, `agency.proposal` |
| **Zod schemas** | `<Entity>Schema` | `LeadIntakeSchema`, `ScopeResultSchema` |

---

## Database Workflow

```bash
# Create migration
supabase migration new <name>

# Apply locally
supabase db reset

# Generate types
supabase gen types typescript --local > packages/database/types.ts
```

**Never use Supabase Dashboard Table Editor.**

---

## Agency Module

### Tables
```
agency_leads, agency_briefs, agency_proposals
```

### Actions & Costs
| Action | BU Cost | Description |
|--------|---------|-------------|
| `agency:scope:generate` | 50 | AI brief analysis |
| `agency:proposal:draft` | 100 | AI proposal generation |

### Schemas (import these, don't recreate)
```typescript
import { LeadIntakeSchema } from '@/modules/agency/schemas/intake';
import { ScopeResultSchema } from '@/modules/agency/schemas/brief';
import { ProposalResultSchema } from '@/modules/agency/schemas/proposal';
```

---

## Current Session

**Phase:** _______________

**Task:** _______________

**Goal:** _______________

### Example (delete when filling in):
```
Phase: Phase 1 – Core Kernel v0
Task: 1.8 Implement ledger.record() helper
Goal: Usage events inserted correctly with org_id scoping
```

---

## Canonical Pattern: Agency Server Action

```typescript
// modules/agency/actions/briefs.ts
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { getSessionContext } from '@appdistillery/core/auth';
import { createClient } from '@/lib/supabase/server';
import { ScopeResultSchema } from '../schemas/brief';
import { SCOPING_SYSTEM_PROMPT, SCOPING_USER_TEMPLATE } from '../prompts';

export async function generateScope(briefId: string) {
  // 1. Get session context
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  const supabase = await createClient();

  // 2. Fetch data with tenant/user filter
  const query = supabase
    .from('agency_briefs')
    .select('*')
    .eq('id', briefId)
    .eq('user_id', session.user.id);

  // Filter by tenant if in tenant context
  if (session.tenant) {
    query.eq('tenant_id', session.tenant.id);
  } else {
    query.is('tenant_id', null);  // Personal user mode
  }

  const { data: brief } = await query.single();
  if (!brief) throw new Error('Brief not found');

  // 3. Call Brain with Zod schema (NOT raw prompts)
  const result = await brainHandle({
    tenantId: session.tenant?.id,
    userId: session.user.id,
    moduleId: 'agency',
    taskType: 'agency.scope',
    systemPrompt: SCOPING_SYSTEM_PROMPT,
    userPrompt: SCOPING_USER_TEMPLATE({ /* ... */ }),
    schema: ScopeResultSchema,  // Guarantees typed output
  });

  if (!result.success) throw new Error(result.error);

  // 4. Update database
  await supabase
    .from('agency_briefs')
    .update({ ai_analysis: result.data, status: 'analyzed' })
    .eq('id', briefId);

  return result.data;  // Typed as ScopeResult
}
```

---

## RLS Pattern

```sql
-- For personal user data
CREATE POLICY "personal_isolation" ON public.table_name
  FOR ALL USING (user_id = auth.uid() AND tenant_id IS NULL);

-- For tenant data
CREATE POLICY "tenant_isolation" ON public.table_name
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );
```

---

## Quick Checklist (Before Committing)

- [ ] All data queries include `tenant_id` and `user_id` filters
- [ ] RLS policies exist on new tables (personal + tenant isolation)
- [ ] Brain calls use `brainHandle()` + Zod schema
- [ ] Billable actions use `recordUsage()`
- [ ] Zod schemas imported, not duplicated
- [ ] No direct provider calls (Anthropic/OpenAI)
- [ ] Migration file created (not Dashboard edits)

---

*Reference: See PROJECT_PLAN.md for full specifications*
