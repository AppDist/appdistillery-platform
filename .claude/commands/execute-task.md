---
description: Execute a task with agent orchestration - planning, implementation, review loops, and documentation
argument-hint: <task-id-or-path> [--quick|--full] [extra-context]
---

# Task Execution Workflow

**Input:** $ARGUMENTS

**CRITICAL**: You are the ORCHESTRATOR. You coordinate and delegate - you do NOT implement directly. All implementation work MUST be delegated to specialized agents.

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

**For parallel steps:**
Launch all parallel steps in a SINGLE message with multiple Task calls:

```
Task(subagent_type="appdistillery-developer", prompt="Implement backend...")
Task(subagent_type="ux-ui", prompt="Create component...")
Task(subagent_type="test-engineer", prompt="Write tests...")
```

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

---

## Phase 4: Review Loop

### 4.1 Launch Review Agents (PARALLEL)

All review agents run in parallel in a SINGLE message:

```
Task(subagent_type="code-reviewer", prompt="Review changes for TASK-XXX...")
Task(subagent_type="security-auditor", prompt="Security review for TASK-XXX...")
Task(subagent_type="test-engineer", prompt="Verify test coverage for TASK-XXX...")
```

### 4.2 Collect Review Findings

Aggregate findings from all review agents:
- **Critical**: Must fix before completion
- **Warning**: Should fix or justify
- **Suggestion**: Consider for improvement

### 4.3 Fix Loop (if findings exist)

**If Critical or Warning findings exist:**

1. **Plan fixes** - Determine which agent(s) handle each finding:
   ```markdown
   | Finding | Severity | Fix Agent | Mode |
   |---------|----------|-----------|------|
   | [Issue 1] | Critical | appdistillery-developer | sequential |
   | [Issue 2] | Warning | ux-ui | parallel |
   | [Issue 3] | Warning | test-engineer | parallel |
   ```

2. **Execute fixes** - Delegate to appropriate agents (sequential/parallel per plan)

3. **Re-run quality checks**:
   ```bash
   pnpm test && pnpm typecheck && pnpm build
   ```

4. **New review round** - Return to 4.1

**Continue loop until:**
- No Critical findings remain
- All Warning findings fixed or justified
- Quality checks pass

### 4.4 Quick Mode Exception

In `--quick` mode, skip the full review loop:
- Run quality checks only (`pnpm test && pnpm typecheck && pnpm build`)
- Fix any failures directly
- Do not launch review agents

---

## Phase 5: Documentation

### 5.1 Document Changes

After review loop completes, update documentation:

**Always update:**
- Task file with completion status and summary
- `tasks/INDEX.md` with updated counts

**If architectural changes were made:**
- Create ADR via `/adr [decision-title]`
- Update `.claude/skills/project-context/references/architecture-map.md`

**If dependencies changed:**
- Update `.claude/skills/project-context/references/dependencies.md`

**If new patterns established:**
- Update `.claude/skills/project-context/references/module-patterns.md`

### 5.2 Update Task File

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

### Documentation Updated
- [x] Task file completed
- [x] INDEX.md updated
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
| 1. Load Task | Yes | Yes |
| 2. Planning | Yes | Yes (may use strategic-advisor) |
| 3. Implementation | Agent delegation | Agent delegation |
| 4. Review Loop | Quality checks only | Full review agents + fix loop |
| 5. Documentation | Task file only | Task + context docs |
| 6. Completion | Yes | Yes |

| Execution Mode | When to Use |
|----------------|-------------|
| Sequential | Steps depend on each other |
| Parallel | Steps are independent |

**Remember: You are the ORCHESTRATOR. Agents IMPLEMENT. Never skip delegation.**
