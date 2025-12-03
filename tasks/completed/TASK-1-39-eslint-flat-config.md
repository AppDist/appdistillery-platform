---
id: TASK-1-39
title: Add ESLint flat config
priority: P2-Medium
complexity: 1
module: web
status: COMPLETED
created: 2025-12-02
review-id: M3
fix-phase: 5
---

# TASK-1-39: Add ESLint Flat Config

## Description

ESLint 9 uses flat config by default. Verify the current ESLint configuration is properly set up and create `eslint.config.js` if needed.

## Acceptance Criteria

- [ ] `pnpm lint` runs without configuration errors
- [ ] Linting catches expected issues
- [ ] No false positives
- [ ] Config follows ESLint 9 flat config format

## Technical Notes

### ESLint 9 Flat Config Format

```javascript
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      // Custom rules
    }
  }
]
```

### Verification Steps

1. Check current ESLint setup in `apps/web`
2. Run `pnpm lint` and check for config errors
3. If using legacy `.eslintrc`, migrate to flat config
4. Verify TypeScript and Next.js plugins work

### Files to Create/Modify

- `apps/web/eslint.config.js` - Create or update
- Remove `.eslintrc.js` or `.eslintrc.json` if exists

### Patterns to Follow

- Use ESLint 9 flat config format
- Include TypeScript ESLint
- Include Next.js ESLint plugin
- Configure for project paths

## Implementation Agent

- **Implement**: `appdistillery-developer`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with L1, L2, L3
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M3 |
