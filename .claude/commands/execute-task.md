---
description: Execute a task with agent orchestration - planning, implementation, review loops, and documentation
argument-hint: <task-id-or-path> [--quick|--full] [extra-context]
---

# Task Execution Workflow

**Input:** $ARGUMENTS

**CRITICAL**: You are the ORCHESTRATOR. You coordinate and delegate - you do NOT implement directly. All implementation work MUST be delegated to specialized agents.

---

## ORCHESTRATOR ROLE ENFORCEMENT

You NEVER write implementation code directly. If you catch yourself about to edit source files, STOP.

**VIOLATIONS (never do these):**
- Using Edit/Write tools on source files (*.ts, *.tsx, *.css, etc.)
- Running Bash commands that modify code
- Fixing TypeScript errors directly
- Making "small fixes" without delegating

**ALLOWED actions:**
- Moving task files between directories
- Updating task status in frontmatter
- Updating INDEX.md counts
- Running read-only commands (git status, git diff, pnpm test, pnpm typecheck)
- Committing changes at Phase 6

**Also a VIOLATION:**
- Editing documentation files directly (dependencies.md, architecture-map.md, module-patterns.md)
  → Delegate to `documentation-writer` agent

**HARD STOP:** If you find yourself about to edit code → STOP and delegate to appropriate agent.

---

## Phase 0: Parse Arguments

Parse the input to extract:
- **Task identifier**: Task ID (e.g., "0-06") or full path (e.g., "tasks/backlog/TASK-0-06-feature.md")
- **Workflow mode**: `--quick` or `--full` (default: auto-detect from complexity)
- **Extra context**: Any additional instructions after the flags

```
Examples:
/execute-task 0-06                         → Auto mode, task ID
/execute-task 1-01 --full                  → Full mode, task ID
/execute-task 0-06 --quick Focus on mocks only
```

---

## Phase 0.5: Load Project Context (MANDATORY)

Before starting any task, load the project context skill for orchestrator overview:

```
Skill("project-context")
```

This provides the orchestrator with:
- Architecture overview
- Critical rules (never/always)
- Naming conventions
- Available agents and when to use them

**Note:** Subagents have this skill auto-loading in their configuration, so you don't need to pass context to them - they will load it themselves when needed.

---

## Phase 1: Load Task

### 1.1 Find Task File

**If task ID provided (e.g., "0-06"):**
1. Search `tasks/backlog/TASK-{id}-*.md`
2. If not found, search `tasks/active/TASK-{id}-*.md`
3. If not found → STOP with error "Task not found"

### 1.2 Load Task Content

Read the task file and extract:
- **Title**: From `# TASK-XXX:` header
- **Priority**: P1-High, P2-Medium, P3-Low
- **Complexity**: 1-5 points
- **Module**: core, agency, web, database, ui
- **Acceptance Criteria**: List of testable conditions
- **Dependencies**: Blocked by / Blocks relationships

### 1.3 Determine Workflow Mode

**Auto-detection (if no flag provided):**
- Complexity 1-2 points → Quick mode
- Complexity 3+ points → Full mode

**Override with flags:**
- `--quick` → Force quick mode (skip review loop)
- `--full` → Force full mode (include review loop)

---

## Phase 2: Planning Decision (MANDATORY)

### 2.1 Assess Planning Complexity

Evaluate if the task requires strategic planning:

**Delegate to `strategic-advisor` agent if ANY of these apply:**
- Complexity 4-5 points
- Touches multiple modules (cross-cutting)
- Requires architecture decisions
- Has unclear implementation approach
- Involves trade-offs between approaches

**Orchestrator plans directly if:**
- Complexity 1-3 points
- Single module scope
- Clear implementation path from task file
- Follows established patterns

### 2.2 Execute Planning

**If delegating to strategic-advisor:**
```
Task(
  subagent_type="strategic-advisor",
  prompt="Analyze and plan TASK-XXX: [title]

  Task file: [path]
  Acceptance criteria: [list]

  Provide:
  1. Implementation approach
  2. Step-by-step execution plan with:
     - Which agent handles each step
     - Sequential vs parallel execution mode
     - Dependencies between steps
  3. Review strategy
  4. Risk assessment"
)
```

**If orchestrator plans directly:**
Create the execution plan yourself following section 2.3.

### 2.3 Execution Plan Format (REQUIRED)

The plan MUST specify for each step:

```markdown
## Execution Plan: TASK-XXX

### Implementation Steps

| Step | Description | Agent | Mode | Depends On |
|------|-------------|-------|------|------------|
| 1 | [What to do] | [agent-name] | sequential | - |
| 2 | [What to do] | [agent-name] | parallel | - |
| 3 | [What to do] | [agent-name] | parallel | - |
| 4 | [What to do] | [agent-name] | sequential | 2, 3 |

### Review Strategy

| Review Type | Agent | Mode |
|-------------|-------|------|
| Code quality | code-reviewer | parallel |
| Security | security-auditor | parallel |
| Tests | test-engineer | parallel |

### Agent Selection Rationale
- Step 1: [agent] because [reason]
- Step 2: [agent] because [reason]
```

**Agent Reference:**

| Domain | Agent | Use For |
|--------|-------|---------|
| Backend/Core | `appdistillery-developer` | Server Actions, services, business logic |
| Frontend/UI | `ux-ui` | Components, styling, accessibility |
| Database | `database-architect` | Migrations, RLS, schema |
| Testing | `test-engineer` | Test creation, test fixes |
| Security | `security-auditor` | Security review, auth patterns |
| Code Review | `code-reviewer` | Quality review, patterns |
| Exploration | `Explore` | Find patterns, understand code |
| Complex Planning | `strategic-advisor` | Architecture, trade-offs |

### 2.4 Get Plan Approval

Present the execution plan to user with AskUserQuestion:
- "Approve - Start execution"
- "Revise - Modify plan first"

---

## Phase 3: Implementation

### 3.1 Move Task to Active

```bash
mv tasks/backlog/TASK-XXX-*.md tasks/active/
```

Update task file frontmatter:
```yaml
status: IN_PROGRESS
started: [Today's date]
```

### 3.2 Execute Steps Per Plan

**CRITICAL: You MUST delegate to agents. Do NOT implement yourself.**

**For sequential steps:**
Execute one at a time, wait for completion before next.

```
Task(
  subagent_type="[agent from plan]",
  prompt="[Detailed implementation instructions]

  Context:
  - Task: TASK-XXX
  - Step: [N] of [total]
  - Acceptance criteria relevant to this step: [list]
  - Files to modify: [list]
  - Patterns to follow: [reference]

  Return: Summary of changes made and any issues encountered."
)
```

**For parallel steps (MANDATORY VERIFICATION):**

CRITICAL: You MUST launch parallel steps in a SINGLE message with MULTIPLE Task calls.

**Before sending, verify:**
- Count of Task() calls in your message: [N]
- Expected from plan (steps marked "parallel"): [N]
- If mismatch → STOP and restructure your message

**CORRECT example (two parallel calls in ONE message):**
```
<your_message>
Task(subagent_type="ux-ui", prompt="Create login page...")
Task(subagent_type="ux-ui", prompt="Create signup page...")
</your_message>
```

**WRONG example (single call doing multiple things):**
```
Task(subagent_type="ux-ui", prompt="Create login AND signup pages...")
```

The wrong example executes sequentially even though the plan said parallel!

### 3.3 Track Progress

Update TodoWrite after each step completes:
```
TodoWrite([
  { content: "Step 1: [desc]", status: "completed" },
  { content: "Step 2: [desc]", status: "in_progress" },
  { content: "Step 3: [desc]", status: "pending" },
  ...
])
```

### 3.4 Run Quality Checks

After implementation steps complete:
```bash
pnpm test && pnpm typecheck && pnpm build
```

If failures occur, proceed to Review Loop (Phase 4) to diagnose and fix.

### CHECKPOINT: Before Phase 4

**STOP and verify before proceeding:**
- [ ] Did I delegate ALL implementation to agents? (not edit code myself)
- [ ] Did parallel steps use SINGLE message with multiple Task() calls?
- [ ] Did I avoid implementing/fixing code directly?

If ANY answer is NO → STOP, identify the violation, and correct by delegating to agents.

---

## Phase 4: Review Loop

### 4.0 Run Verification (MANDATORY)

Before launching review agents, run the `/verify` command:

```
SlashCommand("/verify")
```

This catches build errors, hardcoded values, and i18n violations that review agents might miss.

If `/verify` reports **FIX REQUIRED**, delegate fixes to appropriate agent before proceeding.

### 4.1 Determine Review Agents (Domain-Routed)

**ALWAYS launch these 2 base reviewers:**
- `code-reviewer` - Pattern compliance, code quality
- `security-auditor` - Auth, tenant isolation, input validation

**PLUS 1-2 domain experts based on files changed:**

| Files Changed | Add Domain Expert | Reason |
|---------------|-------------------|--------|
| `packages/database/`, `supabase/migrations/` | `database-architect` | RLS, schema, indexes |
| `apps/web/src/components/`, `packages/ui/`, UI `.tsx` files | `ux-ui` | Accessibility, design system |
| `packages/core/`, cross-module imports | `architecture-advisor` | Module boundaries |
| Data fetching, queries, list rendering | `performance-analyst` | Query optimization |

**Total: 3-4 reviewers per task (2 base + 1-2 domain)**

### 4.2 Launch Review Agents (PARALLEL)

All review agents run in parallel in a SINGLE message:

```
Task(subagent_type="code-reviewer", prompt="Review changes for TASK-XXX...")
Task(subagent_type="security-auditor", prompt="Security review for TASK-XXX...")
Task(subagent_type="[domain-expert]", prompt="[Domain-specific review] for TASK-XXX...")
```

**Example for UI task:**
```
Task(subagent_type="code-reviewer", prompt="Review changes for TASK-XXX...")
Task(subagent_type="security-auditor", prompt="Security review for TASK-XXX...")
Task(subagent_type="ux-ui", prompt="Accessibility and design system review for TASK-XXX...")
```

**Example for database task:**
```
Task(subagent_type="code-reviewer", prompt="Review changes for TASK-XXX...")
Task(subagent_type="security-auditor", prompt="Security review for TASK-XXX...")
Task(subagent_type="database-architect", prompt="RLS and schema review for TASK-XXX...")
```

### 4.3 Collect Review Findings

Aggregate findings from all review agents:
- **Critical**: Must fix before completion
- **Warning**: Should fix or justify
- **Suggestion**: Consider for improvement

### 4.4 Fix Loop (MANDATORY STRUCTURE)

**If Critical or Warning findings exist, follow this EXACT process:**

**Step 1: Create Fix Plan Table (REQUIRED)**

You MUST create this table before fixing anything:

```markdown
| # | Finding | Severity | Agent | Mode | Status |
|---|---------|----------|-------|------|--------|
| 1 | [Issue description] | Critical | [agent-name] | sequential | pending |
| 2 | [Issue description] | Warning | [agent-name] | parallel | pending |
| 3 | [Issue description] | Warning | [agent-name] | parallel | pending |
```

**Step 2: Execute Fixes Per Table**

- Sequential fixes: One Task() call at a time
- Parallel fixes: SINGLE message with multiple Task() calls (same rule as Phase 3)
- Update status to "completed" after each fix completes
- NEVER fix code directly - always delegate to agents

**Step 3: Re-run Quality Checks (MANDATORY)**

```bash
pnpm test && pnpm typecheck && pnpm build
```

**Step 4: Re-review Decision (MANDATORY)**

If ANY Critical or High-severity findings were fixed → You MUST return to 4.1 for a new review round.

DO NOT SKIP re-review. Fixes can introduce regressions that only review agents catch.

**Exit Criteria (ALL must be true):**
- No Critical findings remain
- All Warning findings fixed or justified
- Quality checks pass
- If fixes were made to Critical/High issues, re-review completed

### 4.5 Quick Mode Exception

In `--quick` mode, use lighter review:
- Run `/verify` command (catches build errors, hardcoded values)
- Launch `code-reviewer` only (skip security + domain experts)
- Fix any failures by delegating to appropriate agent (never fix directly)
- Skip documentation updates in Phase 5

### CHECKPOINT: Before Phase 5

**STOP and verify before proceeding:**
- [ ] Did I create a fix plan table before fixing?
- [ ] Did I delegate ALL fixes to agents (not fix directly)?
- [ ] Did parallel fixes use SINGLE message with multiple Task() calls?
- [ ] Did I re-review after Critical/High fixes?

If ANY answer is NO → STOP, go back, and correct the process violation.

---

## Phase 5: Documentation

### 5.1 Documentation Checklist

Run through this checklist for EVERY task completion:

| Question | If Yes → Delegate To |
|----------|---------------------|
| Were new packages/dependencies added? | documentation-writer |
| Were new exports/import paths created? | documentation-writer |
| Was package structure changed? | documentation-writer |
| Was a significant architecture decision made? | documentation-writer (ADR) |

### 5.2 Delegate Documentation Updates (Full Mode)

**CRITICAL: You MUST delegate documentation to agents. Do NOT edit docs yourself.**

**If ANY documentation updates needed:**

Launch documentation-writer agent(s) - can run in parallel:

```
Task(
  subagent_type="documentation-writer",
  prompt="Update project context documentation for TASK-XXX: [title]

  ## Changes Made
  [Summary of implementation]

  ## Documentation Updates Needed
  - [ ] dependencies.md: [New packages added]
  - [ ] module-patterns.md: [New exports/patterns]
  - [ ] architecture-map.md: [Structural changes]

  ## Files Changed
  [List of files]

  Update the relevant context files to reflect these changes.
  Follow DRY principles - don't duplicate information.

  Return: Summary of documentation updates made."
)
```

**For ADRs (if architecture decision was made):**

```
Task(
  subagent_type="documentation-writer",
  prompt="Create ADR for TASK-XXX architecture decision

  ## Decision
  [What was decided]

  ## Context
  [Why this decision was needed]

  ## Options Considered
  [Alternatives]

  Create ADR following the template in docs/architecture/

  Return: Path to created ADR."
)
```

### 5.3 Update Task File (Orchestrator Allowed - STRICT)

**The orchestrator MAY ONLY do these directly:**
- Move task files between directories (backlog → active → completed)
- Update task file frontmatter (status, dates)

**The orchestrator MUST delegate these to documentation-writer:**
- INDEX.md updates (counts, moving entries between sections)
- Any documentation file changes
- ADR creation
- API docs, schema docs

**VIOLATION:** If you edit INDEX.md or any doc file directly, you are violating orchestrator rules.

```yaml
---
status: COMPLETED
completed: [Today's date]
---

## Progress Log

| Date | Update |
|------|--------|
| [date] | Task created |
| [date] | Completed: [summary of what was done] |
```

Mark all acceptance criteria as checked:
```markdown
- [x] Criterion 1
- [x] Criterion 2
```

### 5.4 Quick Mode Exception

In `--quick` mode:
- Update task file status only
- Skip context documentation updates
- Do not launch documentation-writer

---

## Phase 6: Completion

### 6.1 Move Task to Completed

```bash
mv tasks/active/TASK-XXX-*.md tasks/completed/
```

### 6.2 Update Task Index

Update `tasks/INDEX.md`:
- Move task from Backlog to Completed section
- Update phase statistics

### 6.3 Commit Changes

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

### 6.4 Completion Summary

```markdown
## Task Completed: TASK-XXX

**Title:** [Task title]
**Workflow:** [Quick/Full] mode
**Planning:** [Orchestrator/Strategic-advisor]

### Execution Summary
| Step | Agent | Status |
|------|-------|--------|
| 1. [desc] | [agent] | Completed |
| 2. [desc] | [agent] | Completed |

### Review Rounds
- Round 1: [N] findings → [N] fixed
- Round 2: Clean (if applicable)

### What Was Accomplished
[2-3 sentence summary]

### Quality Gates
- [x] All tests passing
- [x] TypeScript clean
- [x] Build succeeds
- [x] Code review passed (full mode)
- [x] Security review passed (full mode)

### Files Changed
[List of files]

### Documentation Updated (via documentation-writer)
- [x] Task file completed (orchestrator)
- [x] INDEX.md updated (documentation-writer)
- [ ] ADR created (if applicable)
- [ ] Context docs updated (if applicable)

### Commit
[Commit hash]
```

---

## Error Handling

If any phase fails:

1. **STOP** - Do not proceed
2. **Document** - Note failure point and error in task file
3. **Diagnose** - Use `/debug [error]` if needed
4. **Resolve**:
   - Fixable → Plan fix with appropriate agent → Execute → Resume
   - Needs clarification → AskUserQuestion
   - Blocker → Document and STOP

**Never proceed past failure without resolution.**

---

## Quick Reference

| Phase | Quick Mode | Full Mode |
|-------|------------|-----------|
| 0.5 Load Context | Yes | Yes |
| 1. Load Task | Yes | Yes |
| 2. Planning | Yes | Yes (may use strategic-advisor) |
| 3. Implementation | Agent delegation | Agent delegation |
| 4. Review Loop | `/verify` + code-reviewer | `/verify` + 3-4 reviewers + fix loop |
| 5. Documentation | Task file only | Delegate ALL docs to documentation-writer |
| 6. Completion | Yes | Yes |

| Execution Mode | When to Use |
|----------------|-------------|
| Sequential | Steps depend on each other |
| Parallel | Steps are independent |

| Review Agents | Always | Domain-Specific |
|---------------|--------|-----------------|
| code-reviewer | Yes | - |
| security-auditor | Full mode | - |
| ux-ui | - | UI components |
| database-architect | - | Migrations, schema |
| architecture-advisor | - | Core, cross-module |
| performance-analyst | - | Data fetching, queries |

**Remember: You are the ORCHESTRATOR. Agents IMPLEMENT. Never skip delegation.**
**NEW: Always run `/verify` before review agents catch build/hardcoded/i18n issues.**
