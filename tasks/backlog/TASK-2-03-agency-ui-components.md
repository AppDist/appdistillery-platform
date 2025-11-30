---
id: TASK-2-03
title: Agency UI components
priority: P1-High
complexity: 4
module: agency
status: BACKLOG
type: EPIC
created: 2024-11-30
---

# TASK-2-03: Agency UI components

## Description

Create UI components for the Agency module including lead intake form, brief view, and proposal editor.

## Epic Overview

This epic covers all UI work for the Agency module. Will be decomposed into sub-tasks when Phase 2 begins.

## Sub-tasks (to be created)

- [ ] Lead intake form with validation
- [ ] Lead list/table view
- [ ] Brief view component (display AI scope)
- [ ] Proposal editor component
- [ ] Generate scope button/action
- [ ] Generate proposal button/action
- [ ] Loading/streaming states
- [ ] Mobile responsive layouts

## Acceptance Criteria (Epic Level)

- [ ] Lead intake captures client info
- [ ] Brief view displays structured scope clearly
- [ ] Proposal editor allows editing sections
- [ ] Actions trigger AI generation with loading states
- [ ] All components use shadcn/ui
- [ ] Accessible (WCAG 2.1 AA)

## Technical Notes

Key UI components:

```typescript
// Lead Intake Form
export function LeadIntakeForm({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(data: LeadFormData) {
    startTransition(async () => {
      await createLead(data, orgId)
      // Redirect to lead view
    })
  }

  return (
    <form action={handleSubmit}>
      {/* Client name, description, budget, timeline */}
    </form>
  )
}

// Brief View (AI-generated scope)
export function BriefView({ brief }: { brief: Brief }) {
  return (
    <div className="space-y-6">
      <section>
        <h2>Executive Summary</h2>
        <p>{brief.scope.executiveSummary}</p>
      </section>
      <section>
        <h2>Deliverables</h2>
        {brief.scope.deliverables.map(d => (
          <DeliverableCard key={d.name} deliverable={d} />
        ))}
      </section>
      {/* More sections */}
    </div>
  )
}

// Proposal Editor
export function ProposalEditor({ proposal }: { proposal: Proposal }) {
  // Editable sections with rich text
  // Save/export actions
}
```

### Patterns to Follow

- Server Components for data fetching
- Client Components for interactivity
- Use shadcn/ui components
- Form validation with Zod + react-hook-form
- Loading states with Suspense/useTransition

## Dependencies

- **Blocked by**: TASK-2-01 (Database), TASK-2-02 (Actions)
- **Blocks**: TASK-2-04 (Pipeline uses components)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Epic created - will decompose when starting Phase 2 |
