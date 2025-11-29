---
description: Start FOCUS analysis on an error using the seraphae-debugger agent
argument-hint: <error-message-or-description>
---

# Debug Error

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-debugger agent to analyze an error using the FOCUS method.

### Step 1: Capture Error Context

The user has provided: `$ARGUMENTS`

If this is a pasted error message, extract:
- Error type (TypeError, ReferenceError, build error, etc.)
- Error message
- Stack trace (if provided)
- File locations mentioned

If this is a description of unexpected behavior, note the symptoms.

### Step 2: Launch Debugger Agent

Use the Task tool to invoke seraphae-debugger:

```
Task({
  subagent_type: "seraphae-debugger",
  prompt: `Apply FOCUS method to diagnose this error:

## Error/Symptom
${ARGUMENTS}

## Instructions
1. **F**rame the problem in one sentence
2. **O**bserve: What's expected vs actual behavior?
3. **C**onstrain: Narrow the scope systematically
4. **U**ncover: Identify root cause through investigation
5. **S**olve: Provide diagnosis report with fix recommendations

Use skills: seraphae-context, seraphae-debugging

Output a structured Diagnosis Report with:
- Problem Statement
- Root Cause
- Evidence (file:line references)
- Recommended Fix (location + approach)
- Verification Steps`
})
```

### Step 3: Present Findings

After the debugger agent completes, present:
1. Root cause summary
2. Recommended fix location and approach
3. Ask if user wants to proceed with the fix
