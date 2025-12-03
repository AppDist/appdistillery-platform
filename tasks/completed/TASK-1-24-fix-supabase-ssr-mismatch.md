---
id: TASK-1-24
title: Fix @supabase/ssr version mismatch
priority: P1-High
complexity: 1
module: core
status: BACKLOG
created: 2025-12-02
review-id: H5
fix-phase: 2
---

# TASK-1-24: Fix @supabase/ssr Version Mismatch

## Description

Version mismatch exists between packages:
- `packages/core`: `@supabase/ssr: ^0.5.2`
- `apps/web`: `@supabase/ssr: ^0.6.0`

Align to the latest stable version to prevent potential runtime bugs.

## Acceptance Criteria

- [ ] Both packages use identical `@supabase/ssr` version
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Auth flows work correctly after update

## Technical Notes

### Implementation Steps

1. Check latest stable version of `@supabase/ssr`
2. Update `packages/core/package.json` to match `apps/web`
3. Run `pnpm install` to regenerate lockfile
4. Run `pnpm typecheck` to catch any breaking changes
5. Run `pnpm test` to verify

### Files to Modify

- `packages/core/package.json` - Update version to `^0.6.0` or latest
- `pnpm-lock.yaml` - Will be regenerated

### Patterns to Follow

- Use caret (^) for semver compatibility
- Check changelog for breaking changes
- Test auth flows manually if needed

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with M5, L7
- **Phase**: Fix Phase 2 (Performance & Architecture)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H5 |
