---
id: TASK-1-30
title: Standardize form patterns
priority: P2-Medium
complexity: 2
module: web
status: COMPLETED
created: 2025-12-02
review-id: M2
fix-phase: 4
---

# TASK-1-30: Standardize Form Patterns

## Description

Two tenant creation forms use different patterns:
- `create-household-form.tsx`: Manual state + validation
- `create-organization-form.tsx`: react-hook-form + zodResolver

Standardize on react-hook-form for consistency and better maintainability.

## Acceptance Criteria

- [ ] Both forms use react-hook-form
- [ ] Shared utilities extracted where beneficial
- [ ] Visual appearance unchanged
- [ ] Form validation behavior preserved
- [ ] Accessibility maintained

## Technical Notes

### Current State

```tsx
// create-household-form.tsx - Manual pattern
const [name, setName] = useState('')
const [error, setError] = useState('')

// create-organization-form.tsx - react-hook-form pattern
const form = useForm<OrganizationFormData>({
  resolver: zodResolver(organizationSchema)
})
```

### Solution

Refactor `CreateHouseholdForm` to use react-hook-form:

```tsx
const form = useForm<HouseholdFormData>({
  resolver: zodResolver(householdSchema),
  defaultValues: { name: '' }
})
```

### Files to Modify

- `apps/web/src/components/tenants/create-household-form.tsx` - Refactor to react-hook-form
- Optionally extract shared form utilities

### Patterns to Follow

- Use zodResolver for schema validation
- Follow shadcn/ui form patterns
- Maintain existing error message display
- Keep server action integration working

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with H2
- **Phase**: Fix Phase 4 (Code Quality & DRY)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M2 |
