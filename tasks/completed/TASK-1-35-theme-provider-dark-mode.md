---
id: TASK-1-35
title: Add theme provider (dark mode)
priority: P1-High
complexity: 2
module: web
status: COMPLETED
created: 2025-12-02
review-id: H7
fix-phase: 5
---

# TASK-1-35: Add Theme Provider (Dark Mode)

## Description

The application lacks theme support. Add a ThemeProvider using next-themes to enable dark mode with system preference detection and manual toggle.

## Acceptance Criteria

- [ ] Dark mode toggle appears in dashboard header
- [ ] Theme persists across page refreshes
- [ ] No hydration mismatch errors
- [ ] System preference respected by default
- [ ] Smooth transition between themes

## Technical Notes

### Current State

```tsx
// Current - no theme support
<html lang="en">
  <body className={inter.variable}>{children}</body>
</html>
```

### Solution

1. Install `next-themes` if not present
2. Create ThemeProvider wrapper
3. Add to root layout
4. Create theme toggle component

```tsx
// providers/theme-provider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

### Files to Create/Modify

- `apps/web/src/components/providers/theme-provider.tsx` - New provider
- `apps/web/src/app/layout.tsx` - Add ThemeProvider
- `apps/web/src/components/theme-toggle.tsx` - New toggle component
- `apps/web/src/components/dashboard/header.tsx` - Add toggle to header

### Patterns to Follow

- Use next-themes for SSR-safe theming
- Add suppressHydrationWarning to html element
- Use shadcn/ui dropdown for toggle
- Follow design system colors for dark mode

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with H6
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H7 |
