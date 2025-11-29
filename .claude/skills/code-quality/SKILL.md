---
name: code-quality
description: Code quality and best practices for AppDistillery Platform's Next.js 15 + TypeScript + Supabase stack. Use when writing or reviewing code, refactoring, implementing features, or ensuring DRY principles, type safety, modular architecture, and React patterns. Essential for Server Actions, brainHandle usage, and tenant isolation.
---

# AppDistillery Code Quality & Best Practices

Code quality guidelines for maintaining consistency, type safety, and best practices across the AppDistillery Platform.

## Quick Reference

**Tech Stack:**
- Next.js 15 + React 19 + TypeScript 5.x
- TailwindCSS 4 + shadcn/ui
- Supabase (Postgres + Auth)
- Vercel AI SDK + @ai-sdk/anthropic
- Turborepo + pnpm workspaces
- Zod for validation

**When to use this skill:**
- Writing new features or components
- Reviewing code for quality
- Creating Server Actions
- Implementing AI operations with brainHandle
- Database queries with tenant isolation

## Critical Rules

| Never | Always |
|-------|--------|
| Call Anthropic/OpenAI directly | Use `brainHandle()` from `@appdistillery/core/brain` |
| Write to `usage_events` directly | Use `recordUsage()` from `@appdistillery/core/ledger` |
| Edit schema in Supabase Dashboard | Create migrations via `supabase migration new` |
| Return raw JSON from AI prompts | Use `generateObject` with Zod schema |
| Duplicate Zod schemas | Import from `modules/*/schemas/` |
| Import across modules | Use Core services or events |
| Query without org_id | Always filter by `org_id` for tenant isolation |

## Core Principles

### 1. DRY - Extract Patterns Immediately

When you see duplication, extract it immediately:

```typescript
// ❌ BAD: Repetitive async state handling
function ComponentA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... same pattern repeated in ComponentB, ComponentC
}

// ✅ GOOD: Custom hook extracts the pattern
function useAsyncAction<T>(action: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return { success: true as const, data: await action() };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      return { success: false as const, error: message };
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { loading, error, execute };
}
```

### 2. Modular Monolith Architecture

AppDistillery uses a modular monolith with hard seams:

```
apps/web/           → Next.js 15 application
packages/core/      → Kernel: auth, brain, ledger, modules
packages/database/  → Migrations + generated Supabase types
packages/ui/        → Shared components (shadcn/ui)
modules/agency/     → First module (consultancy tool)
```

**Data Flow:** UI → Server Action → `brainHandle()` → `recordUsage()` → Supabase

```typescript
// ❌ BAD: Cross-module import
import { something } from '@/modules/other-module/internal';

// ✅ GOOD: Use Core services
import { brainHandle } from '@appdistillery/core/brain';
import { recordUsage } from '@appdistillery/core/ledger';
```

See [architecture-patterns.md](references/architecture-patterns.md) for module boundary details.

### 3. Type Safety First

Always prefer explicit types over `any`. Use Zod for runtime validation:

```typescript
// ❌ BAD: Implicit any
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}

// ✅ GOOD: Explicit types with Zod schema
import { z } from 'zod';

export const ScopeResultSchema = z.object({
  deliverables: z.array(z.object({
    title: z.string().describe('Short deliverable name'),
    description: z.string().describe('What will be delivered'),
    estimatedHours: z.number().describe('Estimated hours'),
  })).describe('List of project deliverables'),
  timeline: z.string().describe('Suggested project timeline'),
  assumptions: z.array(z.string()).describe('Key assumptions made'),
});

export type ScopeResult = z.infer<typeof ScopeResultSchema>;
```

See [type-patterns.md](references/type-patterns.md) for TypeScript/Zod patterns.

### 4. Tenant Isolation

Every database query MUST filter by `org_id`:

```typescript
// ❌ DANGEROUS: No tenant isolation
const { data } = await supabase
  .from('agency_leads')
  .select('*');

// ✅ SAFE: Always filter by org_id
const { data } = await supabase
  .from('agency_leads')
  .select('*')
  .eq('org_id', session.orgId);
```

RLS policies provide defense-in-depth, but application code must also filter.

## Server Action Pattern

The canonical pattern for AI operations:

```typescript
'use server'

import { brainHandle } from '@appdistillery/core/brain';
import { recordUsage } from '@appdistillery/core/ledger';
import { getSessionContext } from '@appdistillery/core/auth';
import { createServerClient } from '@supabase/ssr';
import { ScopeInputSchema, ScopeResultSchema } from '@/modules/agency/schemas';

export async function generateScope(input: unknown) {
  // 1. Get session context
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  // 2. Validate input with Zod
  const validated = ScopeInputSchema.parse(input);

  // 3. Call AI via brainHandle (never direct Anthropic)
  const result = await brainHandle({
    task: 'agency.scope',
    input: validated,
    outputSchema: ScopeResultSchema,
  });

  // 4. Record usage (never write to usage_events directly)
  await recordUsage({
    orgId: session.orgId,
    action: 'agency:scope:generate',
    tokens: result.usage.totalTokens,
    cost: 50, // Brain Units
  });

  // 5. Save to database with org_id
  const supabase = createServerClient(/* ... */);
  await supabase
    .from('agency_briefs')
    .insert({
      org_id: session.orgId, // Always include!
      lead_id: validated.leadId,
      scope: result.output,
    });

  return result.output;
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

Examples: `agency:scope:generate`, `agency:proposal:draft`, `agency:lead:create`

### Brain Task Types

```
<module>.<task>
```

Examples: `agency.scope`, `agency.proposal`

### Code Naming

| Type | Convention | Example |
|------|------------|---------|
| Zod schemas | PascalCase + Schema | `LeadIntakeSchema`, `ScopeResultSchema` |
| Types | PascalCase | `BrainTask`, `ModuleManifest` |
| Functions | camelCase | `brainHandle()`, `recordUsage()` |
| Files | kebab-case | `lead-intake.ts`, `scope-result.ts` |

## File Organization

### Module Structure

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
│   │   └── index.ts          # Re-exports
│   └── components/           # Module UI components
└── package.json
```

## Error Handling

Use discriminated unions for type-safe results:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function performAction(input: Input): Promise<Result<Output>> {
  try {
    const result = await operation(input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Usage with type narrowing
const result = await performAction(input);
if (result.success) {
  console.log(result.data.id); // TypeScript knows data exists
} else {
  console.error(result.error); // TypeScript knows error exists
}
```

## Code Review Checklist

Before submitting code for review, verify:

- [ ] **DRY**: No duplicate code patterns (extract to hooks/utilities)
- [ ] **Type Safety**: All functions have explicit return types, no `any`
- [ ] **brainHandle**: AI operations use `brainHandle()`, not direct API calls
- [ ] **recordUsage**: Usage tracking via `recordUsage()`, not direct DB writes
- [ ] **Tenant Isolation**: All queries filter by `org_id`
- [ ] **Zod Validation**: Input validation with Zod schemas
- [ ] **Server Actions**: Secrets stay server-side, not in client components
- [ ] **Naming**: Follow project naming conventions consistently
- [ ] **Migrations**: Schema changes via `supabase migration new`
- [ ] **Error Handling**: Proper error handling with Result types

## Anti-Patterns to Avoid

```typescript
// ❌ Direct AI API calls
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();
const response = await anthropic.messages.create(/* ... */);

// ✅ Use brainHandle
const result = await brainHandle({
  task: 'agency.scope',
  input: data,
  outputSchema: ScopeResultSchema,
});
```

```typescript
// ❌ Missing org_id in queries
await supabase.from('leads').select('*');

// ✅ Always filter by org_id
await supabase.from('leads').select('*').eq('org_id', orgId);
```

```typescript
// ❌ Cross-module imports
import { helper } from '@/modules/other-module/utils';

// ✅ Use Core services or duplicate if truly needed
import { brainHandle } from '@appdistillery/core/brain';
```

## Progressive Disclosure

For detailed patterns, see:

- **[architecture-patterns.md](references/architecture-patterns.md)** - Module boundaries, Core kernel, data flow
- **[framework-patterns.md](references/framework-patterns.md)** - Next.js 15, React 19, Server Components
- **[type-patterns.md](references/type-patterns.md)** - TypeScript strict mode, Zod patterns
- **[testing-patterns.md](references/testing-patterns.md)** - Vitest, testing Server Actions

## Cross-Skill Integration

When working with code quality, also consult:

- **project-context** - Architecture decisions, dependencies, environment variables
- **testing** - Test patterns, coverage requirements, TDD workflows
- **documentation** - ADRs for architecture decisions, API documentation
- **design-system** - UI component styling, semantic tokens
