---
id: TASK-1-25
title: Fix Turbo pipeline task dependencies
priority: P3-Low
complexity: 1
module: web
status: BACKLOG
created: 2025-12-02
review-id: L7
fix-phase: 2
---

# TASK-1-25: Fix Turbo Pipeline Task Dependencies

## Description

The current `turbo.json` has undeclared task dependencies. Tasks like `lint`, `typecheck`, and `test` should depend on `^build` to ensure generated types and transpiled code are available.

## Acceptance Criteria

- [ ] Running `pnpm lint` builds dependencies first
- [ ] Running `pnpm typecheck` builds dependencies first
- [ ] Running `pnpm test` builds dependencies first
- [ ] Pipeline respects correct build order

## Technical Notes

### Current Problem

```json
{
  "lint": {},      // Missing dependency on ^build
  "typecheck": {}, // Missing dependency on ^build
  "test": {}       // Missing dependency on ^build
}
```

### Solution

```json
{
  "lint": {
    "dependsOn": ["^build"]
  },
  "typecheck": {
    "dependsOn": ["^build"]
  },
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

### Files to Modify

- `turbo.json` - Add dependsOn for lint, typecheck, test tasks

### Patterns to Follow

- `^build` means "build dependencies first"
- Add `outputs` for tasks that produce artifacts
- Consider caching implications

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with M5, H5
- **Phase**: Fix Phase 2 (Performance & Architecture)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding L7 |
