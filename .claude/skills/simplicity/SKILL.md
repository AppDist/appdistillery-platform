---
name: simplicity
description: Enforce focused, minimal, integrated implementations. Use when writing new features, reviewing code size, or verifying feature integration. Prevents over-engineering, orphan utilities, and verbose implementations.
---

# Simplicity Guidelines

Keep implementations focused, minimal, and integrated.

## Scope

**Applies to:** TypeScript application/library code in `packages/`, `modules/`, `apps/`

**Excludes (no size limits):**
- SQL migrations (`packages/database/supabase/migrations/`)
- Generated types (`database.types.ts`, `*.generated.ts`)
- Storybook stories (`*.stories.tsx`)
- Config aggregates (`index.ts` re-exports)
- Test fixtures and mock data files

## Quick Reference

**Size Limits:**
- Functions: max 60 lines
- Files: max 300 lines (implementation), 500 lines (tests)
- Task output: target 100-200 lines, max 400 lines

**Escape Hatch:** When exceeding limits is justified, add a comment:
```typescript
// Size-justified: Complex state machine requires sequential steps
export function complexStateMachine() { /* 80 lines */ }
```

**Core Rules:**
- Every feature MUST be integrated in the same task
- No example files - use JSDoc `@example`
- No premature abstraction - wait for 3+ usages (unless ADR-mandated)

## Integration Requirement

**Every feature must be wired into calling code in the same task.**

```
BAD:  Create utility → mark done → "integrate later"
GOOD: Create utility → integrate → verify → mark done
```

### Staged Work Exception

For cross-package or infrastructure changes, staged work is acceptable IF:
1. A minimal real caller exists (or integration harness test)
2. A follow-up issue is linked in the same PR
3. The follow-up has a clear next integration point

### Pre-Completion Verification

Use `knip` (preferred) or grep to verify no orphan exports:

```bash
# Preferred: Run knip for dead code detection
pnpm knip

# Quick check: Verify feature is used in production code
grep -r "functionName" --include="*.ts" | grep -v test | grep -v ".d.ts"

# If no results = orphan utility = task not complete
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Create example files | Use JSDoc `@example` in source |
| Abstract for 1 use case | Wait for 3+ usages |
| Build "future" features | Build what's needed now |
| Create verbose tests | Test behavior, not implementation |
| Assert internal call order | Test public API and outcomes |
| Hard-code without escape hatch | Add `// Size-justified:` when needed |

### Abstraction Exceptions

Earlier abstraction (before 3 usages) is allowed when:
- **ADR-mandated**: Pattern is documented in `docs/decisions/` (e.g., AI adapter pattern)
- **Boundary enforcement**: Abstraction enforces module boundaries across packages
- **Framework requirement**: Next.js/React patterns require specific structure

### Example File Anti-Pattern

```typescript
// ❌ BAD: prompt-sanitizer.example.ts (96 lines of bloat)
// Duplicates JSDoc, adds maintenance burden

// ✅ GOOD: JSDoc in source file
/**
 * Validates prompt before AI call.
 * @example
 * const result = validatePrompt(userInput);
 * if (!result.valid) throw new Error(result.errors[0]);
 */
export function validatePrompt(prompt: string): ValidationResult
```

## Task Size Assessment

**Before starting implementation, estimate:**
- Will this exceed 400 lines? → Decompose first
- Will this create orphan utilities? → Include integration subtask
- Will tests exceed 500 lines? → Test behavior, not implementation

**During implementation, check:**
- Function exceeds 60 lines? → Extract helper
- File exceeds 300 lines? → Split into modules

See [size-guidelines.md](references/size-guidelines.md) for detailed limits.

## When to Load This Skill

- Before implementing any new feature
- During code review for size/integration
- When task output approaches 400 lines
- When creating new utilities or abstractions

## Cross-Skill Integration

- **code-quality** - DRY principles, architecture patterns
- **testing** - Test size limits, behavior testing
- **task-management** - Task decomposition rules
