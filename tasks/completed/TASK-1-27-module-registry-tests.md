---
id: TASK-1-27
title: Create module registry tests
priority: P1-High
complexity: 3
module: core
status: BACKLOG
created: 2025-12-02
review-id: H3
fix-phase: 3
---

# TASK-1-27: Create Module Registry Tests

## Description

Module registry helpers have no test coverage. Create comprehensive tests for all module registry functions including unit tests with mocked Supabase and integration tests.

## Acceptance Criteria

- [ ] All module registry functions have test coverage
- [ ] Coverage reaches 85%+
- [ ] Integration test verifies full install/enable/disable/uninstall cycle
- [ ] Tests follow project patterns

## Technical Notes

### Functions to Test

- `get-installed-modules.ts` - getInstalledModules()
- `is-module-enabled.ts` - isModuleEnabled()
- `actions/install-module.ts` - installModule()
- `actions/uninstall-module.ts` - uninstallModule()

### Test Cases

```typescript
describe('getInstalledModules', () => {
  it('should return empty array for new tenant')
  it('should return installed modules for tenant')
  it('should filter by enabled status')
})

describe('isModuleEnabled', () => {
  it('should return true for enabled module')
  it('should return false for disabled module')
  it('should return false for uninstalled module')
})

describe('installModule', () => {
  it('should install module for tenant')
  it('should fail for non-admin users')
  it('should fail for inactive modules')
  it('should prevent duplicate installations')
})

describe('uninstallModule', () => {
  it('should uninstall module for tenant')
  it('should fail for non-admin users')
  it('should handle already uninstalled gracefully')
})
```

### Files to Create

- `packages/core/src/modules/get-installed-modules.test.ts`
- `packages/core/src/modules/is-module-enabled.test.ts`
- `packages/core/src/modules/actions/install-module.test.ts`
- `packages/core/src/modules/actions/uninstall-module.test.ts`

### Patterns to Follow

- Mock Supabase client for unit tests
- Use integration tests in `__tests__/integration/` for full cycle
- Test RLS policies work correctly

## Implementation Agent

- **Implement**: `test-engineer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with H1, M1
- **Phase**: Fix Phase 3 (Testing Coverage)

## Dependencies

- **Blocked by**: TASK-1-16 (RLS fixes for tenant_modules)
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H3 |
