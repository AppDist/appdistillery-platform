---
description: Analyze build failure by running build and diagnosing errors
---

# Build Failure Analysis

---

## Instructions

You are diagnosing a build failure for the AppDistillery Platform (Turborepo monorepo).

### Step 1: Load Context

Load the debugging skill for systematic analysis:
```
Skill("debugging")
```

### Step 2: Run Build

Execute the build command to capture current errors:

```bash
pnpm build 2>&1 | head -100
```

Also run TypeScript check for clearer type errors:

```bash
pnpm typecheck 2>&1 | head -50
```

### Step 3: Analyze Errors

Apply the FOCUS method from the debugging skill:

1. **Frame**: Identify the PRIMARY error (first error in chain)
2. **Observe**: What's expected vs actual behavior?
3. **Constrain**: Classify error type:
   - TypeScript strict mode violations
   - ESLint errors
   - Missing 'use client' directive for hooks/browser APIs
   - Import resolution failures (check monorepo paths)
   - Environment variable access issues
   - Circular dependencies
   - Turborepo cache issues
4. **Uncover**: Trace to root cause
5. **Solve**: Provide fix recommendations

### Step 4: Present Fix Plan

After diagnosis:
1. List errors in priority order (fix blocking errors first)
2. Provide exact file:line locations
3. Suggest fix approach for each error
4. Ask if user wants to proceed with fixes

### Common Monorepo Patterns

- Package imports: `@appdistillery/core`, `@appdistillery/ui`, `@appdistillery/database`
- Server Actions must use `'use server'` directive
- Client components must use `'use client'` directive
- Workspace dependencies use `workspace:*` in package.json
