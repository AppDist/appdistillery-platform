---
description: Create an Architecture Decision Record (ADR)
argument-hint: <decision-title>
---

# Create ADR

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-documenter agent to create an Architecture Decision Record.

### Step 1: Capture Decision

Decision title: `$ARGUMENTS`

### Step 2: Launch Documenter Agent

Use the Task tool to invoke seraphae-documenter:

```
Task({
  subagent_type: "seraphae-documenter",
  prompt: `Create an Architecture Decision Record for: ${ARGUMENTS}

## ADR Creation Workflow

### 1. Check Existing ADRs
Read docs/adr/ directory to:
- Find next sequential number (ADR-001, ADR-002, etc.)
- Understand existing style and format

### 2. Gather Context
If this is a complex decision, may need to:
- Review relevant code
- Understand current architecture
- Identify alternatives considered

### 3. Create ADR File
Location: docs/adr/ADR-XXX-slug.md

### 4. ADR Template

\`\`\`markdown
# ADR-XXX: ${ARGUMENTS}

## Status
Proposed

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
\`\`\`

### 5. Quality Criteria
- Context explains problem clearly to future readers
- Decision is specific and actionable
- Consequences include BOTH benefits AND trade-offs
- Alternatives show due diligence
- Status is "Proposed" until user approves

Use skills: seraphae-context, seraphae-docs

Output:
- Full ADR file path
- Complete ADR content
- Ask if user wants to change status to "Accepted"`
})
```

### Step 3: Review and Confirm

Present the ADR for review and ask if it should be marked as Accepted.
