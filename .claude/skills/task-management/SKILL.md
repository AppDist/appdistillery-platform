---
name: task-management
description: Comprehensive task management system for agentic coding workflows. Use when creating, structuring, decomposing, tracking, or managing development tasks. Essential for planning work, breaking down features, defining acceptance criteria, managing dependencies, coordinating between agents, and maintaining context across sessions. Applies to user stories, feature specifications, bug reports, refactoring tasks, and any structured development work.
---

# Task Management for Agentic Coding

This skill provides a comprehensive, template-based system for creating, structuring, and managing development tasks in agentic coding workflows. It establishes conventions that ensure consistency across sessions and enables effective coordination in multi-agent systems while maintaining optimal context management.

## Quick Start

**Creating a task:**
1. Use the task template appropriate for your work type (see [references/task-templates.md](references/task-templates.md))
2. Define clear acceptance criteria (see [references/acceptance-criteria.md](references/acceptance-criteria.md))
3. Identify dependencies and estimate complexity
4. Record in project task tracker

**Breaking down complex work:**
1. Identify the appropriate decomposition pattern (see [references/decomposition-patterns.md](references/decomposition-patterns.md))
2. Split into right-sized subtasks (typically 1-5 units of complexity)
3. Map dependencies and sequencing
4. Validate with team/project leads

**For project setup:** Run `scripts/init_project_tasks.py` to generate project-specific task management files.

## Core Principles

### 1. Tasks as Clear Contracts

Every task is a contract between the requester and implementer:
- **Self-contained** - All necessary context included
- **Unambiguous** - Clear success criteria with no interpretation needed
- **Actionable** - Implementer knows exactly what to build
- **Testable** - Success can be objectively verified
- **Estimable** - Complexity/effort can be assessed

### 2. Context-Aware Design

Tasks must balance completeness with context efficiency:
- **Front-load critical information** - Title, priority, and acceptance criteria first
- **Progressive detail** - Essential info in task description, details in linked docs
- **Avoid repetition** - Reference project docs rather than duplicating
- **Use templates** - Consistent structure reduces cognitive load across sessions

### 3. Spec-First, Test-Driven

Define outcomes before implementation:
- **What** - Success criteria (acceptance criteria)
- **How** - Verification approach (test scenarios)
- **Why** - Business value (user story/requirement)

### 4. Right-Sized Decomposition

Match granularity to the work:
- **Too coarse** - Creates ambiguity and coordination challenges
- **Too fine** - Creates overhead and loses context
- **Right-sized** - Typically 1-5 units of complexity per task
- **Dependent-aware** - Minimize cross-task dependencies

### 5. Transparent Dependencies

Document the dependency graph explicitly:
- **Blockers** - What must complete before this task
- **Blocked** - What this task unblocks
- **Related** - Parallel work that may conflict

Never start a task with unresolved blockers.

## Task Structure

### Universal Task Format

Every task uses this minimal structure (customize based on project needs):

```markdown
## Task: [Action-Oriented Title]

**ID:** TASK-XXX
**Priority:** [P0-Critical | P1-High | P2-Medium | P3-Low]
**Complexity:** [X units] (estimated)
**Module/Area:** [component-name]
**Status:** [TODO | IN_PROGRESS | BLOCKED | REVIEW | DONE]

### Context
[Link to PRD/spec OR brief description of business need]

### Acceptance Criteria
1. Given [context], when [action], then [outcome]
2. [Specific measurable criterion]
3. [Testable condition]

### Dependencies
- **Blocks:** [Task IDs this task blocks]
- **Blocked by:** [Task IDs blocking this task]
- **Related:** [Parallel/related tasks]

### Test Coverage
1. [Test covering AC #1]
2. [Edge case test]
3. [Integration test]
```

**Customization guidance:** See [references/task-templates.md](references/task-templates.md) for full templates with optional sections like technical approach, API contracts, rollback plans, and approval gates.

## Task Lifecycle

Tasks flow through standard states:

```
TODO → IN_PROGRESS → [BLOCKED] → REVIEW → DONE
                         ↓
                       TODO (if rejected)
```

**State definitions:**
- **TODO** - Ready to start, all dependencies resolved
- **IN_PROGRESS** - Actively being worked on
- **BLOCKED** - Cannot proceed (missing dependency, pending decision)
- **REVIEW** - Implementation complete, awaiting approval/verification
- **DONE** - Acceptance criteria met, tested, and verified

**Transition checklist:** See [references/task-lifecycle.md](references/task-lifecycle.md) for detailed state transition requirements.

## When to Create Tasks

### Always Create Tasks For

1. **Feature implementation** - Any new functionality
2. **Bug fixes** - Defects requiring investigation + fix
3. **Refactoring** - Code improvements affecting architecture
4. **Schema changes** - Database migrations or data model updates
5. **Integration work** - Connecting modules or external services
6. **Documentation** - Significant docs (architecture decisions, API specs)
7. **Performance improvements** - Optimization work with measurable goals

### Skip Task Creation For

1. **Trivial fixes** - One-line typos, obvious errors (< 5 minutes)
2. **Clarifications** - Questions answered in conversation
3. **Research spikes** - Unless creating formal time-boxed research task
4. **Operational work** - Deployments, monitoring (unless building tooling)

## Task Decomposition Overview

For complex work, decompose using proven patterns. Key patterns:

### 1. Layered (Tech Stack)
Break by technology layers (database → API → UI → tests).
**Use when:** Full-stack features requiring all layers

### 2. Sequential (Dependencies)
Break by dependency chain where each step builds on previous.
**Use when:** Clear dependency chain, linear workflow

### 3. Parallel (Independent)
Break into independent pieces that converge later.
**Use when:** Multiple independent pieces, can work in parallel

### 4. Functional (By Capability)
Break by distinct functional boundaries.
**Use when:** Clear functional separation, can be built independently

**Complete decomposition guidance:** See [references/decomposition-patterns.md](references/decomposition-patterns.md) for 7 proven patterns with examples and anti-patterns.

## Acceptance Criteria Best Practices

### Format: Given-When-Then (Scenario-Based)

```
Given [initial context/state]
When [action/trigger]
Then [expected outcome]
```

**Example:**
```
Given a user with an unpaid invoice
When they click "Pay Now"
Then they are redirected to payment processing
And invoice status updates to "pending_payment"
And audit log captures "payment_initiated" event
```

### Format: Checklist (Rule-Based)

For tasks without clear scenarios:

```
- [ ] System validates input against schema
- [ ] Error messages display in user's language
- [ ] Audit log captures all state changes
- [ ] Response time < 200ms at p95
```

### SMART Criteria

Acceptance criteria must be:
- **Specific** - No ambiguity, precise requirements
- **Measurable** - Quantifiable or objectively verifiable
- **Achievable** - Realistic given constraints
- **Relevant** - Directly serves the user story
- **Testable** - Can write pass/fail tests

**Complete AC guidance:** See [references/acceptance-criteria.md](references/acceptance-criteria.md) for formats, examples, and anti-patterns.

## Multi-Agent Coordination

### Agent Roles

**Main Agent:**
- Tracks overall task status and progress
- Delegates tasks to specialized subagents
- Manages cross-task coordination
- Updates task status and dependencies

**Strategist/Planning Agent:**
- Breaks down complex work into tasks
- Analyzes dependencies and sequencing
- Creates detailed task specifications
- Estimates complexity for each task
- Identifies risks and approval gates

**Specialized Subagents:**
- Execute tasks in their domain (database, integration, docs, etc.)
- Update task status when complete
- Report blockers or issues to main agent

**Coordination patterns:** See [references/multi-agent-patterns.md](references/multi-agent-patterns.md) for detailed orchestration patterns.

## Task Storage

### Recommended Structure

```
<project-root>/
├── tasks/
│   ├── backlog/
│   │   ├── feature-module-a.md
│   │   └── feature-module-b.md
│   ├── active/
│   │   ├── TASK-001-brief-description.md
│   │   └── TASK-002-brief-description.md
│   ├── completed/
│   │   └── TASK-000-project-setup.md
│   └── INDEX.md (task summary/roadmap)
└── .task-config.yaml (project-specific configuration)
```

**Task naming:** `TASK-XXX-brief-description.md` (numbered sequentially)

**Index maintenance:** Keep a summary table in `tasks/INDEX.md`:

```markdown
| ID | Title | Status | Priority | Complexity | Assignee |
|----|-------|--------|----------|------------|----------|
| TASK-001 | Feature X | IN_PROGRESS | P0 | 15 units | agent-a |
| TASK-002 | Bug Fix Y | TODO | P1 | 5 units | - |
```

## Project Initialization

### Setup Script

Run the initialization script to create project-specific task management:

```bash
python scripts/init_project_tasks.py --project-name "MyProject" --path ./
```

This creates:
- Task directory structure
- `.task-config.yaml` with project-specific settings
- Template files customized for your project
- Example tasks showing proper format

**Configuration:** Edit `.task-config.yaml` to set:
- Complexity unit definition (e.g., Q-Units, story points, hours)
- Custom task statuses (if different from standard)
- Module/area names specific to your project
- Approval gate requirements
- Integration settings (if using external task trackers)

## Integration with Project Context

### Context Files

Create project-specific context files that tasks reference:

**`docs/ARCHITECTURE.md`** - System architecture and module boundaries
**`docs/CODING_STANDARDS.md`** - Code style and patterns
**`docs/TESTING_STRATEGY.md`** - Testing requirements and patterns
**`docs/MODULES.md`** - Module descriptions and ownership

Tasks reference these docs rather than duplicating information:

```markdown
### Technical Approach
Follow authentication patterns from docs/ARCHITECTURE.md section 3.2.
Use error handling conventions from docs/CODING_STANDARDS.md.
```

### Module Mapping

Define clear module boundaries in `.task-config.yaml`:

```yaml
modules:
  - name: auth
    path: src/auth
    owner: team-platform
  - name: payment
    path: src/payment
    owner: team-commerce
```

This enables tasks to specify affected modules clearly and helps with impact analysis.

## Quality Checklist

### Before Creating a Task

- [ ] Clear, action-oriented title
- [ ] Priority set based on project criteria
- [ ] Complexity estimated
- [ ] User story/requirement linked or described
- [ ] 3-5 specific acceptance criteria
- [ ] Dependencies identified
- [ ] Test scenarios defined
- [ ] Module(s)/area(s) identified

### Before Starting a Task

- [ ] All blocking dependencies resolved
- [ ] Task specification is clear and complete
- [ ] Test scenarios understood
- [ ] Resources and context available
- [ ] Acceptance criteria are testable

### Before Marking Done

- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Code/work reviewed
- [ ] Documentation updated
- [ ] Related tasks updated if needed
- [ ] Integration verified (if applicable)

## Reference Materials

Comprehensive guidance on specific topics:

- **[references/task-templates.md](references/task-templates.md)** - Complete templates for features, bugs, refactoring, migrations
- **[references/acceptance-criteria.md](references/acceptance-criteria.md)** - Writing effective acceptance criteria with examples
- **[references/decomposition-patterns.md](references/decomposition-patterns.md)** - Breaking down complex work (7 proven patterns)
- **[references/task-lifecycle.md](references/task-lifecycle.md)** - Detailed state management and transitions
- **[references/multi-agent-patterns.md](references/multi-agent-patterns.md)** - Orchestration patterns for multi-agent systems
- **[references/context-optimization.md](references/context-optimization.md)** - Token-efficient task management strategies

## Common Pitfalls

❌ **Too vague** - "System should be fast"
✅ **Specific** - "API responds in <200ms at p95 for search queries"

❌ **Too prescriptive** - "Use PostgreSQL JSONB with GIN index"
✅ **Outcome-focused** - "Search returns results in <100ms for 10k records"

❌ **Too broad** - "Build the authentication system"
✅ **Scoped** - "Implement JWT token generation and validation"

❌ **Implementation details in AC** - "Use bcrypt with cost factor 12"
✅ **Requirements in AC** - "Passwords stored using industry-standard hashing"

---

*This skill ensures consistent, context-aware task management across all agents and sessions, supporting spec-driven, test-driven development in agentic coding workflows.*
