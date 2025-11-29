# Multi-Agent Coordination Patterns

This guide covers coordination patterns for multi-agent systems working with tasks.

## Agent Roles

### Strategist/Planning Agent
**Responsibilities:**
- Break down PRD sections into tasks
- Analyze dependencies and sequencing  
- Create detailed specifications
- Estimate complexity
- Identify risks and approval gates

**When to use:**
- Starting work on new features
- Complex work requiring decomposition
- Need task breakdown for estimation
- Coordinating multi-module changes

### Main/Orchestrator Agent
**Responsibilities:**
- Track overall progress
- Delegate tasks to specialized agents
- Manage cross-task coordination
- Resolve blockers
- Update task index

### Specialized Subagents
**Examples:**
- Database agent (schema, migrations)
- Integration agent (external APIs)
- Documentation agent (ADRs, specs)
- Testing agent (test coverage)

**Responsibilities:**
- Execute tasks in their domain
- Update task status
- Report blockers

## Coordination Patterns

### Pattern 1: Sequential Handoff

```
Main Agent → Strategist → Database Agent → API Agent → Frontend Agent → Main Agent
```

**Use when:** Clear dependency chain

**Example:**
1. Main agent identifies feature need
2. Strategist breaks down into tasks
3. Database agent creates schema
4. API agent builds endpoints (blocked by DB)
5. Frontend agent builds UI (blocked by API)
6. Main agent integrates and verifies

### Pattern 2: Parallel Execution

```
Main Agent → Strategist → [Agent A | Agent B | Agent C] → Integration Agent
```

**Use when:** Independent work streams

**Example:**
1. Main agent requests feature
2. Strategist decomposes into independent tasks
3. Multiple agents work in parallel
4. Integration agent combines results

### Pattern 3: Approval Gates

```
Agent → Review Gate → Approval → Continue
```

**Use when:** Critical operations (payments, external comms)

**Implementation:**
```markdown
### Approval Gate
- [ ] Security review required
- [ ] Cost approval required
- [ ] User approval required (for emails)
```

## Task Handoff Protocol

When transferring tasks between agents:

```markdown
## Handoff
**From:** Agent A
**To:** Agent B  
**Date:** 2025-01-15
**Completed:** [What was done]
**Next:** [What needs to happen]
**Blockers:** [Any issues]
**Files:** [Changed files]
```

## State Management

### Shared State
- Task status in file system
- Dependencies in task specifications
- Progress in INDEX.md

### Agent-Specific State  
- Each agent maintains own context
- Handoff notes provide continuity
- Main agent tracks overall progress

## Best Practices

1. **Clear ownership** - One agent owns each task
2. **Explicit handoffs** - Document when passing tasks
3. **Update status immediately** - Don't let tasks become stale
4. **Communicate blockers** - Flag issues early
5. **Coordinate integration** - Plan merge points for parallel work

---

*For detailed orchestration patterns, see also: decomposition-patterns.md for breaking down work across agents.*
