---
id: TASK-1-06
title: Module registry helpers
priority: P2-Medium
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
completed: 2024-12-02
---

# TASK-1-06: Module registry helpers

## Description

Create TypeScript helpers for querying and managing module installations.

## Acceptance Criteria

- [x] getInstalledModules(tenantId) helper
- [x] isModuleEnabled(tenantId, moduleId) helper
- [x] installModule Server Action
- [x] uninstallModule Server Action
- [x] Module manifest type definition

## Technical Notes

Helpers for module management:

```typescript
// Get installed modules for tenant
export async function getInstalledModules(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_modules')
    .select('*, module:modules(*)')
    .eq('tenant_id', tenantId)
    .eq('enabled', true)
  return data
}

// Check if module is enabled
export async function isModuleEnabled(tenantId: string, moduleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_modules')
    .select('enabled')
    .eq('tenant_id', tenantId)
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
- Include tenant_id in all queries

## Dependencies

- **Blocked by**: TASK-1-05 (Module tables)
- **Blocks**: TASK-2-04 (Agency manifest)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2024-12-02 | Completed: All helpers and Server Actions implemented with role authorization, tenant isolation, and Zod validation |
