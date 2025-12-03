---
id: TASK-1-32
title: Consolidate cn() utility
priority: P2-Medium
complexity: 1
module: ui
status: BACKLOG
created: 2025-12-02
review-id: M7
fix-phase: 4
---

# TASK-1-32: Consolidate cn() Utility

## Description

The `cn()` utility function is duplicated in:
- `packages/ui/src/lib/utils.ts`
- `apps/web/src/lib/utils.ts`

Consolidate to a single source of truth in the UI package.

## Acceptance Criteria

- [ ] Single source of truth for `cn()` function in packages/ui
- [ ] All imports throughout web app resolve correctly
- [ ] Build passes
- [ ] No duplicate function definitions

## Technical Notes

### Current State

Both files contain:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Solution

1. Ensure `packages/ui` exports `cn` from its main entry point
2. Update `apps/web/src/lib/utils.ts` to re-export from UI package

```typescript
// apps/web/src/lib/utils.ts
export { cn } from '@appdistillery/ui/lib/utils'
// or if needed, keep local for tree-shaking:
// export { cn } from '@appdistillery/ui'
```

### Files to Modify

- `packages/ui/package.json` - Verify exports
- `packages/ui/src/index.ts` - Export cn if not already
- `apps/web/src/lib/utils.ts` - Re-export from UI package

### Patterns to Follow

- Keep backward compatibility for existing imports
- Verify tree-shaking works correctly
- Test with `pnpm build` to verify bundling

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with M4, M8
- **Phase**: Fix Phase 4 (Code Quality & DRY)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M7 |
