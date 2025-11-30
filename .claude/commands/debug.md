---
description: Start FOCUS analysis on an error using systematic debugging
argument-hint: <error-message-or-description>
---

# Debug Error

**Input:** $ARGUMENTS

---

## Instructions

You are applying the FOCUS debugging method to analyze an error in the AppDistillery Platform.

### Step 1: Load Skills

Load the debugging skill for systematic analysis:
```
Skill("debugging")
```

### Step 2: Capture Error Context

The user has provided: `$ARGUMENTS`

If this is a pasted error message, extract:
- Error type (TypeError, ReferenceError, build error, RLS error, etc.)
- Error message
- Stack trace (if provided)
- File locations mentioned

If this is a description of unexpected behavior, note the symptoms.

### Step 3: Apply FOCUS Method

**F - Frame** the problem in one sentence
- What is the actual error or unexpected behavior?

**O - Observe** expected vs actual behavior
- What should happen?
- What actually happens?
- When did it start failing?

**C - Constrain** the scope systematically
- Which package/module? (`apps/web`, `packages/core`, `modules/agency`)
- Which layer? (UI, Server Action, Core Service, Database)
- Can you reproduce reliably?

**U - Uncover** root cause through investigation
- Read relevant files
- Check recent changes
- Look for patterns

**S - Solve** with diagnosis report

### Step 4: Present Diagnosis Report

```markdown
## Diagnosis Report

### Problem Statement
[One sentence summary]

### Root Cause
[What is actually causing the issue]

### Evidence
- `file:line` - [what was found]
- `file:line` - [what was found]

### Recommended Fix
**Location:** `path/to/file.ts:XX`
**Approach:** [description of fix]

### Verification Steps
1. [How to verify the fix works]
2. [How to prevent regression]
```

### Step 5: Offer to Fix

After presenting diagnosis, ask if user wants to proceed with the recommended fix.

### Common AppDistillery Patterns

- **RLS errors**: Check `org_id` filters and RLS policies
- **Type errors**: Verify Zod schemas match expected types
- **AI errors**: Ensure using `brainHandle()` not direct provider calls
- **Usage errors**: Ensure using `recordUsage()` for ledger writes
