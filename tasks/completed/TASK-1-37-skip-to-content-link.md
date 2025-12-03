---
id: TASK-1-37
title: Add skip-to-content link
priority: P3-Low
complexity: 1
module: web
status: BACKLOG
created: 2025-12-02
review-id: L2
fix-phase: 5
---

# TASK-1-37: Add Skip-to-Content Link

## Description

Dashboard layout lacks skip navigation for keyboard users. Add a skip-to-content link that appears on Tab press and allows users to bypass the sidebar navigation.

## Acceptance Criteria

- [ ] Skip link appears on Tab press from page start
- [ ] Activating link focuses main content area
- [ ] Works with keyboard navigation
- [ ] Visually hidden until focused
- [ ] Styled consistently with design system

## Technical Notes

### Implementation

```tsx
// In dashboard layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
>
  Skip to main content
</a>

{/* Sidebar */}

<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### Files to Modify

- `apps/web/src/app/(dashboard)/layout.tsx` - Add skip link and main id

### Patterns to Follow

- Use sr-only with focus:not-sr-only pattern
- Add tabIndex={-1} to main for programmatic focus
- Use design system colors
- Test with keyboard-only navigation

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with L1, L3, M3
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding L2 |
