---
description: Execute a task with configurable workflow (quick or full) including planning, implementation, testing, and optional review/documentation
argument-hint: <task-id-or-path> [--quick|--full] [extra-context]
---

# Task Execution Workflow

**Input:** $ARGUMENTS

---

## Step 0: Parse Arguments

Parse the input to extract:
- **Task identifier**: Either a task ID (e.g., "001") or full path (e.g., "tasks/backlog/TASK-001-feature.md")
- **Workflow mode**: `--quick` or `--full` (default: auto-detect from complexity)
- **Extra context**: Any additional instructions after the flags

```
Examples:
/execute-task 001                          → Auto mode, task ID
/execute-task 001 --full                   → Full mode, task ID
/execute-task tasks/backlog/TASK-001.md --quick
/execute-task 002 --full Focus on error handling
```

---

## Phase 1: Load Task & Context

### 1.1 Find Task File

**If task ID provided (e.g., "001"):**
1. Search `tasks/backlog/TASK-001-*.md`
2. If not found, search `tasks/active/TASK-001-*.md`
3. If not found → STOP with error "Task not found"

**If full path provided:**
1. Verify file exists at path
2. If not found → STOP with error

### 1.2 Load Task Content

Read the task file and extract:
- **Title**: From `# TASK-XXX:` header
- **Priority**: P1-High, P2-Medium, P3-Low
- **Complexity**: 1-5 points
- **Module**: core, agency, web, database, ui
- **Acceptance Criteria**: List of testable conditions
- **Dependencies**: Blocked by / Blocks relationships

### 1.3 Load Skills

Load relevant skills based on task:
```
Skill("project-context")   # Always load
Skill("code-quality")      # Always load
```

Additional skills based on task type:
| Task Type | Skills to Load |
|-----------|---------------|
| UI/Components | `design-system`, `shadcn`, `tailwindcss` |
| Database | `supabase` |
| Testing | `testing` |
| Next.js specific | `nextjs` |
| AI features | `ai-llm-setup` |

### 1.3a Agent Orchestration Strategy

The main agent acts as **orchestrator**, delegating specialized work to agents in `.claude/agents/`.

**Agent Selection by Task Type:**

| Task Domain | Primary Agent | Support Agents |
|-------------|---------------|----------------|
| Backend/Server Actions | appdistillery-developer | test-engineer, database-architect |
| Frontend/UI | ux-ui | test-engineer |
| Database | database-architect | security-auditor |
| Testing | test-engineer | appdistillery-developer |
| Security-sensitive | security-auditor | appdistillery-developer |

**Parallel Execution:**
Launch independent agents in parallel (single message, multiple Task calls):
- Implementation + Testing can run in parallel after planning
- Multiple file explorations can run in parallel
- Frontend + Backend when they don't depend on each other

**Context Gathering:**
Before implementation, use `Explore` agent to:
- Find similar patterns in codebase
- Identify files to modify
- Understand existing implementations

### 1.4 Determine Workflow Mode

**Auto-detection (if no flag provided):**
- Complexity 1-2 points → Quick mode
- Complexity 3+ points → Full mode

**Override with flags:**
- `--quick` → Force quick mode
- `--full` → Force full mode

### 1.5 Initialize Progress Tracking

**Quick Mode:**
```
TodoWrite([
  { content: "Load task and plan", status: "in_progress" },
  { content: "Implement changes", status: "pending" },
  { content: "Test and verify", status: "pending" },
  { content: "Commit and complete", status: "pending" }
])
```

**Full Mode:**
```
TodoWrite([
  { content: "Load task and plan", status: "in_progress" },
  { content: "Implement changes", status: "pending" },
  { content: "Test and verify", status: "pending" },
  { content: "Review code quality", status: "pending" },
  { content: "Update documentation", status: "pending" },
  { content: "Commit and complete", status: "pending" }
])
```

### 1.6 Present Plan & Get Approval

Present execution plan:
```markdown
## Task Execution Plan

**Task:** TASK-XXX - [Title]
**Priority:** [Priority] | **Complexity:** [X] points
**Module:** [Module]
**Workflow:** [Quick/Full] mode

### Acceptance Criteria
[List from task file]

### Implementation Approach
[Brief description]

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
mv tasks/backlog/TASK-XXX-*.md tasks/active/
```

Update task file status:
```
**Status:** IN_PROGRESS
**Started:** [Today's date]
```

### 2.2 Implement Changes

Follow these principles:
1. **Read before write** - Understand existing code before modifying
2. **Incremental changes** - Small, testable commits
3. **Follow patterns** - Use existing project patterns
4. **Type safety** - No `any`, use Zod for external data

**Critical AppDistillery patterns:**
- Use `brainHandle()` for AI calls (not direct provider)
- Use `recordUsage()` for usage tracking
- Include `org_id` in all tenant queries
- Use Server Actions for mutations
- Use Zod schemas for validation

### 2.2a Delegate to Specialized Agents

For complex implementations, delegate to specialized agents:

**Backend work:**
```
Task(subagent_type="appdistillery-developer", prompt="Implement [feature]...")
```

**Frontend work:**
```
Task(subagent_type="ux-ui", prompt="Create component for [feature]...")
```

**Parallel delegation (single message, multiple calls):**
```
Task(subagent_type="appdistillery-developer", prompt="Implement Server Action...")
Task(subagent_type="ux-ui", prompt="Create form component...")
```

See `.claude/INDEX.md` for full agent list and selection guide.

### 2.3 Track Progress

Update TodoWrite as you complete each step.

---

## Phase 3: Testing

### 3.1 Run Tests

```bash
pnpm test              # Unit tests
pnpm lint              # ESLint
pnpm typecheck         # TypeScript
pnpm build             # Verify build
```

### 3.2 Handle Failures

If tests fail:
1. Use `/debug` command to diagnose
2. Fix issues
3. Re-run tests

### 3.3 Verify Acceptance Criteria

Go through each acceptance criterion:
- [ ] Criterion 1 - [Verified/Not verified]
- [ ] Criterion 2 - [Verified/Not verified]

If any criterion not met, return to Phase 2.

---

## Phase 4: Review (Full Mode Only)

### 4.1 Code Review

Use `/review` command on changed files:
```
/review [changed files]
```

Focus on:
- TypeScript strictness
- Architecture compliance
- Tenant isolation
- Security
- Performance

### 4.2 Address Findings

- Fix all Critical findings
- Fix or justify Warning findings
- Consider Suggestion findings

### 4.3 Re-run Tests

```bash
pnpm test && pnpm lint && pnpm build
```

---

## Phase 5: Documentation (Full Mode Only)

### 5.1 Update Documentation

If needed:
- **ADR**: For architectural decisions, use `/adr [decision-title]`
- **Code comments**: Add JSDoc for public APIs
- **README**: Update if new features affect usage

---

## Phase 6: Completion

### 6.1 Move Task to Completed

```bash
mv tasks/active/TASK-XXX-*.md tasks/completed/
```

Update task file:
```
**Status:** COMPLETED
**Completed:** [Today's date]
```

### 6.2 Update Task Index

Update `tasks/INDEX.md`:
- Update counts
- Move task to "Recently Completed"

### 6.3 Commit Changes

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(module): implement TASK-XXX description

- [Key change 1]
- [Key change 2]

Acceptance criteria: all met

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6.4 Summary

```markdown
## Task Completed: TASK-XXX

**Title:** [Task title]
**Workflow:** [Quick/Full] mode

### What Was Accomplished
[2-3 sentence summary]

### Key Changes
- [Bullet point changes]

### Quality Gates
- [x] All tests passing
- [x] Build succeeds
- [x] Lint clean
[Full mode only:]
- [x] Code review passed
- [x] Documentation updated

### Files Changed
[List of files]

### Commit
[Commit hash]
```

---

## Error Handling

If any phase fails:

1. **STOP** - Do not proceed
2. **Document** - Note failure point and error
3. **Diagnose** - Use `/debug` if needed
4. **Resolve**:
   - Fixable → Fix and resume
   - Needs clarification → Ask user
   - Blocker → Document and STOP

**Never proceed past failure without resolution.**

---

## Quick Reference

| Workflow | Phases | When to Use |
|----------|--------|-------------|
| Quick | Plan → Implement → Test → Commit | 1-2 point tasks |
| Full | Plan → Implement → Test → Review → Docs → Commit | 3+ point tasks |

| Task Type | Key Skills |
|-----------|-----------|
| UI Components | `design-system`, `shadcn`, `tailwindcss` |
| Server Actions | `code-quality`, `supabase` |
| Database | `supabase` |
| Testing | `testing` |
| AI Features | `ai-llm-setup` |
