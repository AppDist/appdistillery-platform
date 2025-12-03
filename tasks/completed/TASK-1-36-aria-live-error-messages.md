---
id: TASK-1-36
title: Add aria-live to error messages
priority: P3-Low
complexity: 1
module: web
status: BACKLOG
created: 2025-12-02
review-id: L1
fix-phase: 5
---

# TASK-1-36: Add aria-live to Error Messages

## Description

Error messages in auth forms use `role="alert"` but lack `aria-live` for proper screen reader announcement. Add `aria-live="polite"` to ensure errors are announced when they appear.

## Acceptance Criteria

- [ ] Screen readers announce error messages when they appear
- [ ] No duplicate announcements
- [ ] Works across all auth forms
- [ ] Maintains visual styling

## Technical Notes

### Current State

```tsx
<p role="alert" className="text-destructive">
  {error}
</p>
```

### Solution

```tsx
<p role="alert" aria-live="polite" className="text-destructive">
  {error}
</p>
```

### Files to Modify

- `apps/web/src/app/(auth)/login/login-form.tsx`
- `apps/web/src/app/(auth)/signup/signup-form.tsx`
- `apps/web/src/components/tenants/create-household-form.tsx`
- `apps/web/src/components/tenants/create-organization-form.tsx`

### Patterns to Follow

- Use `aria-live="polite"` (not "assertive") for form errors
- Combine with `role="alert"` for broader support
- Test with screen reader (VoiceOver, NVDA)

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with L2, L3, M3
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding L1 |
