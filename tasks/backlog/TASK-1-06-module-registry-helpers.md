---
id: TASK-1-06
title: Module registry helpers
priority: P2-Medium
complexity: 2
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-1-06: Module registry helpers

## Description

Create TypeScript helpers for querying and managing module installations.

## Acceptance Criteria

- [ ] getInstalledModules(orgId) helper
- [ ] isModuleEnabled(orgId, moduleId) helper
- [ ] installModule Server Action
- [ ] uninstallModule Server Action
- [ ] Module manifest type definition

## Technical Notes

Helpers for module management:

```typescript
// Get installed modules for org
export async function getInstalledModules(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_modules')
    .select('*, module:modules(*)')
    .eq('org_id', orgId)
    .eq('enabled', true)
  return data
}

// Check if module is enabled
export async function isModuleEnabled(orgId: string, moduleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_modules')
    .select('enabled')
    .eq('org_id', orgId)
    .eq('module_id', moduleId)
    .single()
  return data?.enabled ?? false
}
```

### Module Manifest Type

```typescript
export interface ModuleManifest {
  id: string
  name: string
  description: string
  version: string
  routes: {
    path: string
    icon: string
    label: string
  }[]
  usageActions: string[] // e.g., ['agency:scope:generate']
}
```

### Files to Create/Modify

- `packages/core/src/modules/get-installed-modules.ts`
- `packages/core/src/modules/is-module-enabled.ts`
- `packages/core/src/modules/actions/install-module.ts`
- `packages/core/src/modules/types.ts` - Manifest type
- `packages/core/src/modules/index.ts` - Public exports

### Patterns to Follow

- Export helpers from packages/core
- Use Supabase server client
- Include org_id in all queries

## Dependencies

- **Blocked by**: TASK-1-05 (Module tables)
- **Blocks**: TASK-2-04 (Agency manifest)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
