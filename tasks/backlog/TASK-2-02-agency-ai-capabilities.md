---
id: TASK-2-02
title: Agency AI capabilities
priority: P1-High
complexity: 4
module: agency
status: BACKLOG
type: EPIC
created: 2024-11-30
---

# TASK-2-02: Agency AI capabilities

## Description

Implement AI-powered features for the Agency module using brainHandle() for scope generation and proposal writing.

## Epic Overview

This epic covers all AI integration work for the Agency module. Will be decomposed into sub-tasks when Phase 2 begins.

## Sub-tasks (to be created)

- [ ] Create LeadIntakeSchema (Zod)
- [ ] Create ScopeResultSchema (Zod)
- [ ] Create ProposalResultSchema (Zod)
- [ ] Implement generateScope Server Action
- [ ] Implement generateProposal Server Action
- [ ] Create system prompts for each task
- [ ] Add AI response tests with mocked output

## Acceptance Criteria (Epic Level)

- [ ] Zod schemas defined in modules/agency/schemas/
- [ ] Server Actions use brainHandle() (not direct AI)
- [ ] Usage recorded for each AI call
- [ ] Structured output matches schemas
- [ ] Prompts produce quality results

## Technical Notes

AI integration points:

```typescript
// Schema for scope generation output
export const ScopeResultSchema = z.object({
  executiveSummary: z.string(),
  objectives: z.array(z.string()),
  deliverables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    estimatedEffort: z.string(),
  })),
  timeline: z.object({
    phases: z.array(z.object({
      name: z.string(),
      duration: z.string(),
      deliverables: z.array(z.string()),
    })),
    totalDuration: z.string(),
  }),
  budgetEstimate: z.object({
    low: z.number(),
    high: z.number(),
    currency: z.string(),
  }),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
})

// Server Action
export async function generateScope(leadId: string, orgId: string) {
  const lead = await getLead(leadId, orgId)

  const scope = await brainHandle({
    task: 'agency.scope',
    action: 'agency:scope:generate',
    schema: ScopeResultSchema,
    prompt: buildScopePrompt(lead),
    system: SCOPE_SYSTEM_PROMPT,
    orgId,
    moduleId: 'agency',
  })

  // Save to agency_briefs
  await saveBrief(leadId, scope, orgId)

  return scope
}
```

### Patterns to Follow

- Schemas in modules/agency/schemas/
- Server Actions in modules/agency/actions/
- Always use brainHandle() (never call AI directly)
- Action naming: agency:scope:generate, agency:proposal:generate

## Dependencies

- **Blocked by**: TASK-1-11 (brainHandle), TASK-2-01 (Database)
- **Blocks**: TASK-2-03 (UI needs actions)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Epic created - will decompose when starting Phase 2 |
