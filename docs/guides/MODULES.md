# Module Development Guide

Guide for creating modules in the AppDistillery modular monolith.

## Structure

```
modules/<name>/src/
├── manifest.ts    # Module definition
├── schemas/       # Zod schemas
├── actions/       # Server Actions
└── components/    # UI (optional)
```

## 1. Manifest (`src/manifest.ts`)

```typescript
export const manifest: ModuleManifest = {
  id: 'my-module',
  name: 'My Module',
  version: '0.1.0',
  routes: [{ path: '/my-module', label: 'Dashboard' }],
  usageActions: ['my-module:action:verb'],
};
```

## 2. Schemas (`src/schemas/`)

```typescript
export const InputSchema = z.object({
  field: z.string().describe('AI description'),
});
```

## 3. Actions (`src/actions/`)

```typescript
'use server'

export async function myAction(input: unknown) {
  const session = await getSessionContext();
  const validated = InputSchema.parse(input);

  const result = await brainHandle({
    task: 'my-module.task',
    input: validated,
    outputSchema: OutputSchema,
  });

  await recordUsage({
    orgId: session.orgId,
    action: 'my-module:action:verb',
    tokens: result.usage.totalTokens,
    cost: 50,
  });

  return result.output;
}
```

## 4. Database Tables

Pattern: `<module>_<entity>` with `org_id` and RLS.

```sql
CREATE TABLE my_module_items (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id)
);

ALTER TABLE my_module_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON my_module_items
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

## 5. Register in Core

`packages/core/src/modules/registry.ts`:

```typescript
export const moduleRegistry = new Map([['my-module', manifest]]);
```

## Rules

**Never:** Import from other modules, bypass Core services
**Always:** Use brainHandle/recordUsage, filter by org_id

## Usage Actions

Format: `<module>:<domain>:<verb>` (e.g., `agency:scope:generate`)

## Example

See `modules/agency/` for complete implementation.

## References

- `modules/agency/` - Reference implementation
- `docs/decisions/0001-modular-monolith.md` - Architecture
- `.claude/skills/code-quality/references/module-patterns.md` - Detailed patterns
