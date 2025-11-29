---
description: Analyze build failure by running build and diagnosing errors
---

# Build Failure Analysis

---

## Instructions

You are diagnosing a build failure for the Seraphaé project.

### Step 1: Run Build

Execute the build command to capture current errors:

```bash
pnpm build 2>&1 | head -100
```

Also run TypeScript check for clearer type errors:

```bash
pnpm tsc --noEmit 2>&1 | head -50
```

### Step 2: Launch Debugger Agent

Use the Task tool to invoke seraphae-debugger with the build output:

```
Task({
  subagent_type: "seraphae-debugger",
  prompt: `Analyze this build failure:

## Build Output
[Paste captured output]

## Instructions
Apply FOCUS method:
1. Identify the PRIMARY error (first error in chain)
2. Classify: TypeScript, ESLint, bundling, missing dependency, etc.
3. Trace to root cause
4. Provide fix recommendations

Common build failure patterns:
- Missing 'use client' directive for hooks/browser APIs
- Import resolution failures
- TypeScript strict mode violations
- Environment variable access issues
- Circular dependencies

Use skills: seraphae-context, seraphae-debugging

Output Diagnosis Report with exact file:line locations for fixes.`
})
```

### Step 3: Present Fix Plan

After diagnosis:
1. List errors in priority order
2. Provide fix locations and approaches
3. Ask if user wants to proceed with fixes
