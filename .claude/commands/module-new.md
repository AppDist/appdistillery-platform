---
description: Create a new module with correct structure
argument-hint: <module-name>
---

# Create New Module

**Input:** $ARGUMENTS

---

## Instructions

You are creating a new module for the AppDistillery Platform.

### Step 1: Load Context

Load relevant skills:
```
Skill("project-context")
Skill("code-quality")
```

### Step 2: Parse Module Name

Module name: `$ARGUMENTS`

**Naming rules:**
- Lowercase, single word preferred
- If multiple words, use kebab-case for folder, camelCase for code
- Examples: `agency`, `marketing`, `task-tracker`

### Step 3: Validate Name

Check that:
- [ ] Name doesn't conflict with existing modules
- [ ] Name follows conventions
- [ ] Name is descriptive of the module's purpose

```bash
ls -la modules/
```

### Step 4: Create Module Structure

```
modules/<name>/
├── index.ts              # Public exports
├── package.json          # Module package config
├── schemas/
│   └── index.ts          # Zod schemas
├── actions/
│   └── index.ts          # Server Actions
├── components/
│   └── index.ts          # React components
├── lib/
│   └── index.ts          # Internal utilities
└── types/
    └── index.ts          # TypeScript types
```

### Step 5: Create Files

**package.json:**
```json
{
  "name": "@appdistillery/<name>",
  "version": "0.0.1",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./schemas": "./schemas/index.ts",
    "./actions": "./actions/index.ts",
    "./components": "./components/index.ts"
  },
  "dependencies": {
    "@appdistillery/core": "workspace:*",
    "@appdistillery/database": "workspace:*",
    "@appdistillery/ui": "workspace:*"
  }
}
```

**index.ts:**
```typescript
// Public API for @appdistillery/<name>

// Re-export schemas
export * from './schemas'

// Re-export types
export type * from './types'
```

**schemas/index.ts:**
```typescript
import { z } from 'zod'

// Example schema - replace with actual module schemas
export const Example<Name>Schema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  // Add fields
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Example<Name> = z.infer<typeof Example<Name>Schema>
```

**actions/index.ts:**
```typescript
'use server'

import { z } from 'zod'
// Import from core for auth, AI, usage tracking
// import { getSession } from '@appdistillery/core/auth'
// import { brainHandle } from '@appdistillery/core/brain'
// import { recordUsage } from '@appdistillery/core/ledger'

// Example action - replace with actual module actions
export async function exampleAction(input: unknown) {
  // 1. Validate input
  const parsed = z.object({ /* schema */ }).safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // 2. Get session and org_id
  // const session = await getSession()
  // const orgId = session.orgId

  // 3. Perform action with org_id filter

  // 4. Record usage if applicable
  // await recordUsage({ orgId, action: '<name>:example:create', ... })

  return { success: true }
}
```

**components/index.ts:**
```typescript
// Module components
// Export React components here
```

**lib/index.ts:**
```typescript
// Internal utilities for this module
// Not exported publicly
```

**types/index.ts:**
```typescript
// Additional TypeScript types
// Zod-inferred types should go in schemas/
```

### Step 6: Create Database Migration

If the module needs database tables:

```bash
/migration-new create_<name>_tables
```

Follow naming convention: `public.<module>_<entity>`

Example for a "marketing" module:
- `public.marketing_campaigns`
- `public.marketing_contacts`

### Step 7: Register in Workspace

Add to `pnpm-workspace.yaml` if not auto-detected:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'modules/*'  # Should already include modules
```

### Step 8: Update Turborepo

The module should automatically be included in Turborepo builds via the workspace.

### Step 9: Output Summary

```markdown
## Module Created: <name>

**Location:** `modules/<name>/`
**Package:** `@appdistillery/<name>`

### Structure
[tree output]

### Next Steps
1. Define Zod schemas in `schemas/index.ts`
2. Create Server Actions in `actions/index.ts`
3. Run `/migration-new` if database tables needed
4. Build components in `components/`
5. Export public API from `index.ts`

### Usage
```typescript
// Import schemas
import { ExampleSchema } from '@appdistillery/<name>/schemas'

// Import actions
import { exampleAction } from '@appdistillery/<name>/actions'

// Import components
import { ExampleComponent } from '@appdistillery/<name>/components'
```
```

### Step 10: Verify

```bash
pnpm install    # Update workspace dependencies
pnpm typecheck  # Verify TypeScript
pnpm build      # Verify build
```
