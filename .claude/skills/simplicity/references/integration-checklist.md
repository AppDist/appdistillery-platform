# Integration Checklist

Verify features are integrated before marking complete.

## Pre-Completion Checklist

- [ ] Feature has at least one caller in production code
- [ ] Integration is tested (not just the utility)
- [ ] No orphan exports

## Verification Commands

### Check Feature Usage

```bash
# Find all usages of a function
grep -r "validatePrompt" --include="*.ts" | grep -v test | grep -v ".d.ts"

# Expected: At least one result in production code
# If empty = orphan utility = not integrated
```

### Check Orphan Exports

```bash
# List exports from a file
grep "^export" packages/core/src/brain/prompt-sanitizer.ts

# For each export, verify import exists
grep -r "import.*validatePrompt" --include="*.ts" | grep -v ".test.ts"
```

## Integration Patterns

### Correct Integration

```typescript
// prompt-sanitizer.ts
export function validatePrompt(prompt: string): ValidationResult

// brain-handle.ts (integration point)
import { validatePrompt } from './prompt-sanitizer';

export async function brainHandle(task: BrainTask) {
  // ✅ INTEGRATED: validatePrompt is called
  const validation = validatePrompt(task.userPrompt);
  if (!validation.valid) {
    return { success: false, error: validation.errors[0] };
  }
  // ... rest of implementation
}
```

### Incorrect: Orphan Utility

```typescript
// prompt-sanitizer.ts
export function validatePrompt(prompt: string): ValidationResult

// brain-handle.ts - NO INTEGRATION
export async function brainHandle(task: BrainTask) {
  // ❌ validatePrompt never called
  // Feature exists but provides zero value
}
```

## Task Completion Gate

**Before marking ANY task complete:**

1. Run grep to verify usage
2. Verify test covers integration path
3. Verify TypeScript compiles

```bash
# Quick verification script
grep -r "newFeature" --include="*.ts" | grep -v test && \
pnpm typecheck && \
echo "✅ Feature integrated"
```
