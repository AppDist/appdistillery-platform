---
description: Create an Architecture Decision Record (ADR)
argument-hint: <decision-title>
---

# Create ADR

**Input:** $ARGUMENTS

---

## Instructions

You are creating an Architecture Decision Record for the AppDistillery Platform.

### Step 1: Load Context

Load relevant skills:
```
Skill("project-context")
Skill("documentation")
```

### Step 2: Check Existing ADRs

Read `docs/decisions/` directory to:
- Find next sequential number (ADR-001, ADR-002, etc.)
- Understand existing style and format

```bash
ls -la docs/decisions/
```

### Step 3: Gather Context

If this is a complex decision, may need to:
- Review relevant code
- Understand current architecture (see `docs/PROJECT_PLAN.md`)
- Identify alternatives considered

### Step 4: Create ADR File

**Location:** `docs/decisions/ADR-XXX-slug.md`

Use this template:

```markdown
# ADR-XXX: [Decision Title]

## Status

Proposed

## Date

[Today's date: YYYY-MM-DD]

## Context

[What is the issue motivating this decision?]
[Write for someone unfamiliar with the context]
[Include relevant constraints and requirements]

## Decision

[What specific change are we making?]
[Be actionable and clear]
[Include code patterns or file locations if relevant]

## Consequences

### Benefits
- [What becomes easier]
- [Problems solved]

### Trade-offs
- [What becomes more difficult]
- [New constraints introduced]

## Alternatives Considered

### [Alternative 1]
[Brief description and why not chosen]

### [Alternative 2]
[Brief description and why not chosen]

## Related

- Links to relevant code, docs, or other ADRs
```

### Step 5: Quality Criteria

Before finalizing, ensure:
- Context explains problem clearly to future readers
- Decision is specific and actionable
- Consequences include BOTH benefits AND trade-offs
- Alternatives show due diligence
- Status is "Proposed" until user approves

### Step 6: Review and Confirm

Present the ADR for review and ask:
1. Does the context accurately capture the problem?
2. Is the decision clear and actionable?
3. Should status be changed to "Accepted"?

### AppDistillery-Specific Considerations

When writing ADRs for this project, consider:
- **Monorepo impact**: Which packages are affected?
- **Tenant isolation**: Does this affect `org_id` filtering?
- **Core services**: Does this affect `brainHandle()` or `recordUsage()`?
- **Module boundaries**: Does this cross module boundaries?
