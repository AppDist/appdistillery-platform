---
id: TASK-0-06
title: Vitest testing setup
priority: P1-High
complexity: 2
module: core
status: BACKLOG
created: 2024-11-30
---

# TASK-0-06: Vitest testing setup

## Description

Complete Vitest configuration with config files, test utilities, and initial test structure for packages/core and modules/agency.

## Acceptance Criteria

- [ ] vitest.config.ts in packages/core/
- [ ] vitest.config.ts in modules/agency/
- [ ] Test utilities (mocks, fixtures) created
- [ ] Sample test file demonstrating patterns
- [ ] `pnpm test` runs successfully
- [ ] Coverage configuration enabled

## Technical Notes

Vitest v3.2.0 is already installed. Need to add:

1. **Config files** with:
   - TypeScript support
   - Path aliases matching tsconfig
   - Coverage with v8 provider
   - Test environment (node for core, jsdom for UI)

2. **Test utilities**:
   - Mock Supabase client
   - Mock brainHandle responses
   - Test data factories

### Files to Create/Modify

- `packages/core/vitest.config.ts` - Core package config
- `packages/core/src/__tests__/setup.ts` - Test setup
- `packages/core/src/__tests__/mocks/` - Mock utilities
- `modules/agency/vitest.config.ts` - Agency module config

### Patterns to Follow

```typescript
// vitest.config.ts example
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Dependencies

- **Blocked by**: None
- **Blocks**: TASK-1-12 (Brain service tests), TASK-1-14 (RLS test), TASK-1-15 (Integration test)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
