---
description: Full pre-merge code review on recent changes
argument-hint: [scope] (optional - uses git diff if omitted)
---

# Code Review

**Input:** $ARGUMENTS

---

## Instructions

You are performing a comprehensive pre-merge code review for the AppDistillery Platform.

### Step 1: Load Context

Load relevant skills:
```
Skill("code-quality")
Skill("project-context")
```

### Step 2: Determine Scope

If `$ARGUMENTS` is provided, review that path/files.
If empty, detect changes via git:

```bash
git diff --name-only HEAD~1
git status --short
```

### Step 3: Review Checklist

#### 1. TypeScript Strictness
- No `any` in domain logic (use `unknown` if needed)
- Proper return types on functions
- No unjustified type assertions (`as`)
- Zod schemas for all external data

#### 2. Architecture Compliance
- **Server Actions** for mutations (not API routes)
- **Core services** for AI/usage: `brainHandle()`, `recordUsage()`
- **Adapter pattern** for external services
- Proper `'use client'` / `'use server'` directives
- No cross-module imports (use Core events)

#### 3. Tenant Isolation
- All queries include `org_id` filter
- No leaking data across organizations
- RLS policies in place for new tables

#### 4. Security
- Zod validation on ALL Server Action inputs
- Authorization checks in Server Actions
- No sensitive data in error responses
- No secrets in client code (`NEXT_PUBLIC_*`)

#### 5. Performance
- `next/image` for images
- No unnecessary `'use client'` (keep RSC where possible)
- Proper dynamic imports for heavy components
- No N+1 query patterns

#### 6. Accessibility (WCAG 2.2 AA)
- Interactive elements keyboard accessible
- ARIA correctness (labels, roles)
- Form labels and associations
- Focus management
- Touch targets >= 24x24 CSS pixels

### Step 4: Output Format

```markdown
## Code Review Report

**Scope:** [files/paths reviewed]
**Summary:** X Critical | Y Warnings | Z Suggestions

### Critical Issues (must fix)
- `file:line` - [Issue description]

### Warnings (should fix)
- `file:line` - [Issue description]

### Suggestions (consider)
- `file:line` - [Improvement idea]

### Recommended Actions
1. [Prioritized action item]
2. [Next action item]
```

### Step 5: Present Report

Show the review report and ask if user wants to address findings.
