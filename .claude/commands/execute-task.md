---
description: Execute a task with configurable workflow (quick or full) including planning, implementation, testing, and optional review/documentation
argument-hint: <task-id-or-path> [--quick|--full] [extra-context]
---

# Task Execution Workflow

**Input:** $ARGUMENTS

---

## Step 0: Parse Arguments

Parse the input to extract:
- **Task identifier**: Either a task ID (e.g., "001") or full path (e.g., "/tasks/backlog/TASK-001-shopify-adapter.md")
- **Workflow mode**: `--quick` or `--full` (if neither specified, auto-detect from complexity)
- **Extra context**: Any additional instructions after the flags

```
Examples:
/execute-task 001                          → Quick mode (auto), task ID
/execute-task 001 --full                   → Full mode, task ID
/execute-task /tasks/backlog/TASK-001-shopify-adapter.md --quick
/execute-task 002 --full Focus on error handling
```

---

## Phase 1: Load Task & Context

### 1.1 Find Task File

**If task ID provided (e.g., "001"):**
1. Search `/tasks/backlog/TASK-001-*.md`
2. If not found, search `/tasks/active/TASK-001-*.md`
3. If not found → STOP with error "Task TASK-001 not found"

**If full path provided:**
1. Verify file exists at path
2. If not found → STOP with error

### 1.2 Load Task Content

Use Read tool to load the task file. Extract:
- **Title**: From `# TASK-XXX:` header
- **Priority**: P1-High, P2-Medium, P3-Low
- **Complexity**: 1-5 points
- **Phase**: Phase 1, 2, or 3
- **Module**: storefront, checkout, account, loyalty, shipping, core
- **Acceptance Criteria**: List of testable conditions
- **Dependencies**: Blocked by / Blocks relationships

### 1.3 Validate Phase

**Current project phase: Phase 1 (Core Commerce MVP)**

If task phase > 1:
```
⚠️ PHASE MISMATCH: This task is Phase {task.phase}, but current project is Phase 1.

Options:
A) Defer - Keep in backlog for later
B) Proceed - Implement anyway (requires justification)
C) Adapt - Implement a Phase 1-compatible alternative

Use AskUserQuestion to get decision.
```

### 1.4 Determine Workflow Mode

**Auto-detection (if no flag provided):**
- Complexity 1-2 points → Quick mode
- Complexity 3+ points → Full mode
- Cross-module task (spans 3+ areas) → Full mode

**Override with flags:**
- `--quick` → Force quick mode
- `--full` → Force full mode

### 1.5 Load Skills

**Always load:**
```
Skill(seraphae-context)      # Project state and architecture
Skill(seraphae-code-quality) # Coding standards
```

**Load based on module:**
| Module | Additional Skills |
|--------|-------------------|
| storefront | seraphae-shopify, seraphae-design-system |
| checkout | seraphae-shopify |
| account | seraphae-shopify, seraphae-supabase |
| loyalty | seraphae-supabase |
| shipping | seraphae-shopify |
| core | seraphae-nextjs |

### 1.6 Initialize Progress Tracking

**Quick Mode:**
```typescript
TodoWrite({
  todos: [
    { content: "Load task and plan", status: "in_progress", activeForm: "Loading task" },
    { content: "Implement with agents", status: "pending", activeForm: "Implementing" },
    { content: "Test and verify", status: "pending", activeForm: "Testing" },
    { content: "Commit and complete", status: "pending", activeForm: "Committing" }
  ]
})
```

**Full Mode:**
```typescript
TodoWrite({
  todos: [
    { content: "Load task and plan", status: "in_progress", activeForm: "Loading task" },
    { content: "Implement with agents", status: "pending", activeForm: "Implementing" },
    { content: "Test and verify", status: "pending", activeForm: "Testing" },
    { content: "Review code quality", status: "pending", activeForm: "Reviewing" },
    { content: "Update documentation", status: "pending", activeForm: "Documenting" },
    { content: "Commit and complete", status: "pending", activeForm: "Committing" }
  ]
})
```

### 1.7 Present Plan & Get Approval

Present execution plan to user:
```markdown
## Task Execution Plan

**Task:** TASK-XXX - [Title]
**Priority:** [Priority] | **Complexity:** [X] points | **Phase:** [Phase]
**Module:** [Module]
**Workflow:** [Quick/Full] mode

### Acceptance Criteria
[List from task file]

### Implementation Approach
[Brief description of how task will be implemented]

### Agents to Use
- [List relevant agents based on task type]

### Extra Context
[Any additional instructions from $ARGUMENTS]
```

Use AskUserQuestion:
- "Approve - Start execution"
- "Revise - Modify plan first"

---

## Phase 2: Implementation

### 2.1 Move Task to Active

```bash
# Move task file from backlog to active (if in backlog)
mv /tasks/backlog/TASK-XXX-*.md /tasks/active/
```

Update task file status:
```
**Status:** IN_PROGRESS
**Started:** [Today's date]
```

### 2.2 Delegate to Agents

**CRITICAL**: Do NOT write implementation code yourself. Delegate ALL implementation to specialized agents.

**Agent Selection Guide:**

| Task Type | Agent | When to Use |
|-----------|-------|-------------|
| API/Adapter work | seraphae-implementer | Shopify, Supabase, Sendcloud integration |
| Server Actions | seraphae-implementer | Cart, auth, mutations |
| UI Components | ux-ui-specialist | Brand styling, components, accessibility |
| Full Pages | seraphae-implementer + ux-ui-specialist | Pages with data fetching + UI |
| Database | seraphae-migrator | Schema changes, RLS policies |
| Security | seraphae-security | Auth flows, sensitive data |
| Tests | seraphae-tester | Unit, component, E2E tests |
| Bug diagnosis | seraphae-debugger | Runtime errors, build failures |
| i18n/RTL | seraphae-i18n-auditor | Translation completeness, RTL layouts |

**Agent Invocation Pattern:**
```typescript
Task({
  subagent_type: "seraphae-implementer",
  prompt: `Implement TASK-XXX: [Title]

Use skills: seraphae-context, seraphae-code-quality, [module-specific skills]

## Requirements
[Acceptance criteria from task]

## Implementation Notes
[Technical approach from task file]

## Files to Create/Modify
[List from task file]

## Extra Context
[Any additional instructions]

After implementation, ensure all TypeScript compiles and code follows project patterns.`
})
```

### 2.3 Parallel vs Sequential Execution

**IMPORTANT**: Maximize efficiency by running independent agents in parallel.

**Parallel Execution Decision Matrix:**

| Scenario | Execution | Rationale |
|----------|-----------|-----------|
| Adapter + UI components | ✅ Parallel | No shared dependencies |
| Server Action + Component that uses it | ❌ Sequential | Component depends on action |
| Multiple independent UI components | ✅ Parallel | No shared state |
| Database migration + Code using new schema | ❌ Sequential | Code depends on migration |
| Tests for existing code | ✅ Parallel with impl | Tests don't modify implementation |
| Feature + Tests for that feature | ❌ Sequential | Tests need feature to exist |

**Parallel Execution Pattern:**
When work items are independent, launch agents in a **single message** with multiple Task calls:
```typescript
// ✅ CORRECT: Single message, multiple parallel agents
Task({ subagent_type: "seraphae-implementer", prompt: "Implement Shopify adapter..." })
Task({ subagent_type: "ux-ui-specialist", prompt: "Create ProductCard component..." })
Task({ subagent_type: "seraphae-tester", prompt: "Write tests for existing utils..." })
```

**Sequential Execution Pattern:**
When work items have dependencies, wait for each to complete:
```typescript
// Step 1: Create the foundation
Task({ subagent_type: "seraphae-migrator", prompt: "Create rewards_ledger table..." })
// Wait for completion, then...

// Step 2: Build on top
Task({ subagent_type: "seraphae-implementer", prompt: "Implement loyalty adapter using rewards_ledger..." })
```

**Full Page Implementation Example:**
For pages requiring both data layer and UI:
```typescript
// Parallel: Adapter and basic UI structure can be built simultaneously
Task({ subagent_type: "seraphae-implementer", prompt: "Create collection adapter with getCollectionByHandle..." })
Task({ subagent_type: "ux-ui-specialist", prompt: "Create ProductGrid and ProductCard components..." })
// Wait for both, then...

// Sequential: Page assembly requires both pieces
Task({ subagent_type: "seraphae-implementer", prompt: "Wire up CollectionPage using adapter and components..." })
```

### 2.4 Track Progress

Update TodoWrite as agents complete work.

---

## Phase 3: Testing

### 3.1 Run Tests

```bash
pnpm test              # Unit tests
pnpm lint              # ESLint
pnpm build             # Verify build succeeds
```

### 3.2 Handle Failures

If tests fail:
1. Use seraphae-debugger to diagnose
2. Fix issues via appropriate agent
3. Re-run tests

### 3.3 Verify Acceptance Criteria

Go through each acceptance criterion from task file:
- [ ] Criterion 1 - [Verified/Not verified]
- [ ] Criterion 2 - [Verified/Not verified]
- ...

If any criterion not met, return to Phase 2.

---

## Phase 4: Review (Full Mode Only)

### 4.1 Determine Review Scope

Analyze the task to determine which specialized reviews are needed:

| Task Characteristics | Required Reviews |
|---------------------|------------------|
| UI components / pages | ux-ui-specialist (a11y), seraphae-i18n-auditor (RTL) |
| Server Actions | seraphae-security |
| Database / RLS | seraphae-security |
| All tasks | seraphae-reviewer (general quality) |

### 4.2 Launch Specialized Reviews in Parallel

**IMPORTANT**: Run applicable specialized reviews simultaneously for efficiency.

**For UI-heavy tasks:**
```typescript
// Single message, parallel specialized reviews
Task({
  subagent_type: "seraphae-reviewer",
  prompt: `Review implementation for TASK-XXX.
Focus on: TypeScript strictness, architecture compliance, performance.
Files changed: [list files]
Provide findings grouped by severity: Critical, Warning, Suggestion.`
})
Task({
  subagent_type: "ux-ui-specialist",
  prompt: `Accessibility audit for TASK-XXX implementation.
Focus on: WCAG 2.2 AA compliance, keyboard navigation, screen reader support.
Files changed: [list UI files]`
})
Task({
  subagent_type: "seraphae-i18n-auditor",
  prompt: `RTL and i18n audit for TASK-XXX.
Focus on: Logical properties (start/end vs left/right), translation completeness, Arabic text rendering.
Files changed: [list files with UI or translations]`
})
```

**For Server Action / API tasks:**
```typescript
// Single message, parallel reviews
Task({
  subagent_type: "seraphae-reviewer",
  prompt: `Review implementation for TASK-XXX.
Focus on: TypeScript strictness, architecture compliance, error handling.
Files changed: [list files]`
})
Task({
  subagent_type: "seraphae-security",
  prompt: `Security audit for TASK-XXX.
Focus on: Input validation, authorization checks, IDOR vulnerabilities, data exposure.
Files changed: [list Server Action and adapter files]`
})
```

**For database tasks:**
```typescript
// Single message, parallel reviews
Task({
  subagent_type: "seraphae-reviewer",
  prompt: `Review implementation for TASK-XXX.
Focus on: TypeScript strictness, architecture compliance.
Files changed: [list files]`
})
Task({
  subagent_type: "seraphae-security",
  prompt: `RLS policy audit for TASK-XXX.
Focus on: Policy completeness, session variable usage, defense-in-depth.
Tables affected: [list tables]`
})
```

### 4.3 Consolidate Findings

Merge findings from all reviewers into a single prioritized list:

**Critical** (must fix):
- [ ] Finding 1 (from reviewer-name)
- [ ] Finding 2 (from reviewer-name)

**Warning** (should fix or justify):
- [ ] Finding 3 (from reviewer-name)

**Suggestion** (consider):
- [ ] Finding 4 (from reviewer-name)

### 4.4 Address Findings

- Fix all Critical findings
- Fix or justify Warning findings
- Consider Suggestion findings

### 4.5 Re-run Tests

```bash
pnpm test && pnpm lint && pnpm build
```

---

## Phase 5: Documentation (Full Mode Only)

### 5.1 Update Documentation

```typescript
Task({
  subagent_type: "seraphae-documenter",
  prompt: `Update documentation for TASK-XXX completion.

Required updates:
1. If architectural decision was made → Create ADR in docs/architecture/decisions/
2. If new pattern established → Update relevant skill file
3. Update any affected README or guide

Use skill: seraphae-docs`
})
```

---

## Phase 6: Completion

### 6.1 Move Task to Completed

```bash
mv /tasks/active/TASK-XXX-*.md /tasks/completed/
```

Update task file:
```
**Status:** COMPLETED
**Completed:** [Today's date]
```

### 6.2 Update Task Index

Update `/tasks/INDEX.md`:
- Decrement Backlog/Active count
- Increment Completed count
- Move task to "Recently Completed" table

### 6.3 Update Context Files

**IMPORTANT**: Keep project context current for future sessions.

**If dependencies were added:**
Update `.claude/skills/seraphae-context/references/dependencies.md`:
- Add new packages with version and purpose

**If new files/modules were created:**
Update `.claude/skills/seraphae-context/references/architecture-map.md`:
- Add new files to repository structure
- Update "Implemented Modules" section
- Check "Implementation Status" checkboxes

**Always update:**
Update `.ai/memory.md`:
- Add task to "Completed Tasks" table
- Update "Current Focus" section
- Update "Next Steps" if blockers were removed
- Note any key implementations or decisions

### 6.4 Commit Changes

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(module): implement TASK-XXX description

- [Key change 1]
- [Key change 2]
- [Key change 3]

Acceptance criteria: all met

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6.5 Summary

```markdown
## ✅ Task Completed: TASK-XXX

**Title:** [Task title]
**Workflow:** [Quick/Full] mode

### What Was Accomplished
[2-3 sentence summary]

### Key Changes
- [Bullet point changes]

### Quality Gates
- ✅ All tests passing
- ✅ Build succeeds
- ✅ Lint clean
[Full mode only:]
- ✅ Code review passed
- ✅ Documentation updated

### Context Updated
- ✅ .ai/memory.md
- ✅ dependencies.md (if packages added)
- ✅ architecture-map.md (if modules added)

### Files Changed
[List of files]

### Commit
[Commit hash]
```

---

## Error Handling

If any phase fails:

1. **STOP** - Do not proceed to next phase
2. **Document** - Note the failure point and error
3. **Diagnose** - Use seraphae-debugger if needed
4. **Resolve**:
   - Fixable → Fix and resume from failed step
   - Needs clarification → Use AskUserQuestion
   - Blocker → Document and STOP, inform user

**Never proceed past failure without resolution.**

---

## Quick Reference

| Workflow | Phases | When to Use |
|----------|--------|-------------|
| Quick | Plan → Implement → Test → Commit | 1-2 point tasks, simple changes |
| Full | Plan → Implement → Test → Review → Document → Commit | 3+ point tasks, cross-cutting changes |

| Agent | Purpose | Parallel Safe |
|-------|---------|---------------|
| seraphae-implementer | Features, adapters, Server Actions | Yes* |
| ux-ui-specialist | UI components, styling, accessibility | Yes* |
| seraphae-tester | Tests (unit, component, E2E) | Yes** |
| seraphae-reviewer | Code quality review | Yes |
| seraphae-debugger | Error diagnosis | No (diagnostic) |
| seraphae-migrator | Database schema | No (sequential) |
| seraphae-security | Auth, RLS, sensitive data | Yes |
| seraphae-i18n-auditor | Translation completeness, RTL | Yes |
| seraphae-documenter | ADRs, documentation | No (after impl) |
| strategic-planner | Complex task decomposition | No (planning) |

\* Can run in parallel when working on independent modules
\** Can run in parallel with implementation when testing existing code
