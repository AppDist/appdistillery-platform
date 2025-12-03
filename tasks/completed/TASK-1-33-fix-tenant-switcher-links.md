---
id: TASK-1-33
title: Fix tenant switcher navigation links
priority: P2-Medium
complexity: 1
module: web
status: BACKLOG
created: 2025-12-02
review-id: M8
fix-phase: 4
---

# TASK-1-33: Fix Tenant Switcher Navigation Links

## Description

The tenant switcher component has navigation links that may point to incorrect paths. Verify and fix the "Create Household" and "Create Organization" links.

## Acceptance Criteria

- [ ] "Create Household" link navigates to correct page
- [ ] "Create Organization" link navigates to correct page
- [ ] Both pages render correctly
- [ ] Back navigation works properly

## Technical Notes

### Current Links

```tsx
<Link href="/tenants/new?type=household">
<Link href="/tenants/new?type=organization">
```

### Verification Steps

1. Check if route exists at `apps/web/src/app/(dashboard)/tenants/new/page.tsx`
2. If missing, create the route
3. If path is wrong, update links to correct path

### Files to Modify

- `apps/web/src/components/tenants/tenant-switcher.tsx` - Fix links if needed
- `apps/web/src/app/(dashboard)/tenants/new/page.tsx` - Create if missing

### Patterns to Follow

- Use Next.js Link component
- Handle query params correctly in target page
- Maintain consistent routing patterns

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with M4, M7
- **Phase**: Fix Phase 4 (Code Quality & DRY)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M8 |
