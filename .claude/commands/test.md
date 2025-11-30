---
description: Run tests and diagnose failures
argument-hint: [scope] (optional - runs all if omitted)
---

# Test Runner

**Input:** $ARGUMENTS

---

## Instructions

You are running tests for the AppDistillery Platform.

### Step 1: Load Context

Load the testing skill:
```
Skill("testing")
```

### Step 2: Determine Scope

If `$ARGUMENTS` specifies a path or pattern, run tests matching that scope.
If empty, run all tests.

**Scope examples:**
- `packages/core` - Run tests in core package
- `modules/agency` - Run tests in agency module
- `auth` - Run tests matching "auth"
- `apps/web/app/actions` - Run tests for Server Actions

### Step 3: Run Tests

```bash
# All tests
pnpm test

# Scoped tests
pnpm test -- [scope]

# With coverage
pnpm test -- --coverage

# Watch mode (for development)
pnpm test -- --watch
```

### Step 4: Analyze Results

**If all tests pass:**
```markdown
## Test Results: PASS

**Scope:** [scope or all]
**Total:** X tests
**Passed:** X
**Duration:** Xs

### Coverage Summary (if available)
| Package | Lines | Branches | Functions |
|---------|-------|----------|-----------|
| core | X% | X% | X% |
| agency | X% | X% | X% |
```

**If tests fail:**
```markdown
## Test Results: FAIL

**Scope:** [scope or all]
**Total:** X tests
**Passed:** X
**Failed:** X

### Failing Tests

#### 1. [test name]
**File:** `path/to/test.test.ts:line`
**Error:**
```
[error message]
```

**Analysis:**
[Brief analysis of why it might be failing]

**Suggested Fix:**
[Recommendation]
```

### Step 5: Diagnose Failures

For each failing test:

1. **Read the test file** to understand what it's testing
2. **Read the implementation** to find the bug
3. **Check recent changes** that might have broken it
4. **Categorize the failure**:
   - **Test bug**: Test is wrong, implementation is correct
   - **Implementation bug**: Implementation is wrong
   - **Environment issue**: Missing setup, wrong config

### Step 6: Offer Actions

After presenting results:

**If failures exist:**
- "Fix failing tests" - Attempt to fix implementation or test
- "Run in watch mode" - Continue development with live feedback
- "Skip and continue" - Acknowledge failures and move on

**If all pass:**
- "Run with coverage" - See detailed coverage report
- "Done" - Continue with next task

### Common Test Patterns

**Unit Tests (packages/core):**
```typescript
import { describe, it, expect } from 'vitest'

describe('functionName', () => {
  it('should do expected behavior', () => {
    const result = functionName(input)
    expect(result).toBe(expected)
  })
})
```

**Server Action Tests:**
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('actionName', () => {
  it('should validate input with Zod', async () => {
    const result = await actionName({ invalid: 'input' })
    expect(result.error).toBeDefined()
  })
})
```

**Component Tests (packages/ui):**
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```
