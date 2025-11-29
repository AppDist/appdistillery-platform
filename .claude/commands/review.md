---
description: Full pre-merge code review on recent changes
argument-hint: [scope] (optional - uses git diff if omitted)
---

# Code Review

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-reviewer agent for comprehensive pre-merge review.

### Step 1: Determine Scope

If `$ARGUMENTS` is provided, review that path/files.
If empty, detect changes via git:

```bash
git diff --name-only HEAD~1
git status --short
```

### Step 2: Launch Reviewer Agent

Use the Task tool to invoke seraphae-reviewer:

```
Task({
  subagent_type: "seraphae-reviewer",
  prompt: `Perform comprehensive code review for: ${ARGUMENTS || 'recent changes (use git diff)'}

## Review Domains (Check All)

### 1. Accessibility (WCAG 2.2 AA)
- Interactive elements keyboard accessible
- ARIA correctness
- Form labels and associations
- Focus management
- Touch targets >= 24x24 CSS pixels

### 2. RTL Compatibility
- Logical properties (ms-*, me-*, ps-*, pe-*)
- No hardcoded left/right
- Bidirectional text handling

### 3. TypeScript Strictness
- No \`any\` in domain logic
- Proper return types
- No unjustified type assertions

### 4. Architecture Compliance
- Adapter pattern for external services
- Server Actions for mutations
- Proper 'use client' usage

### 5. Server Actions Security
- Zod input validation
- Authorization checks
- No exposed stack traces

### 6. Performance
- next/image for images
- No unnecessary 'use client'
- Proper dynamic imports

Use skills: seraphae-context, seraphae-code-quality

## Output Format

Structured report with:
- Summary (Critical/Warning/Suggestion counts)
- 🔴 Critical Issues (must fix)
- 🟡 Warnings (should fix)
- 🔵 Suggestions (consider)
- Recommended Actions (prioritized)`
})
```

### Step 3: Present Report

Show the review report and ask if user wants to address findings.
