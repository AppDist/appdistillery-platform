---
name: design-system
description: AppDistillery design system with semantic tokens, Tailwind CSS v4, and shadcn/ui. Use when implementing UI components, applying styles, or ensuring visual consistency. Primary blue (#0f6ecc), dark sidebar, Inter/JetBrains Mono fonts.
---

# AppDistillery Design System

Design tokens and patterns for consistent UI styling. Tokens defined in `apps/web/src/app/globals.css`.

## Quick Reference

### Brand Colors

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--primary` | `#0f6ecc` | `#0e63b9` | CTAs, links, focus |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Text on primary |
| `--destructive` | `#ef4444` | `#dc2626` | Errors, delete |
| `--accent` | `#e7f3ff` | `#1f2937` | Hover highlights |

### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | Inter, sans-serif |
| `--font-serif` | Merriweather, serif |
| `--font-mono` | JetBrains Mono, monospace |

### Sizing

| Token | Value |
|-------|-------|
| `--radius` | 0.5rem (8px) |
| `--spacing` | 0.25rem (4px base) |

### Sidebar (Dark Theme)

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `#0d0d0d` | `#000000` |
| `--sidebar-foreground` | `#f8f9fa` | `#e0e0e0` |
| `--sidebar-primary` | `#007aff` | `#0a84ff` |

## Quick Start

When implementing UI components:

1. Use semantic tokens (`bg-primary`, not `bg-[#0f6ecc]`)
2. Follow Tailwind spacing scale (`p-4`, not `p-[17px]`)
3. Use `cn()` utility for conditional class merging
4. Test both light and dark modes

## Core Principles

1. **Never hardcode values** - Use CSS custom properties or Tailwind utilities
2. **Semantic over arbitrary** - Use `--color-primary` not `--blue-500`
3. **Theme-agnostic names** - Tokens work in light and dark modes
4. **Component-first** - Prefer component library patterns (shadcn/ui)
5. **Mobile-first responsive** - Base styles for mobile, enhance for larger screens

## Token Architecture

Design systems use a three-tier token hierarchy:

```
┌─────────────────────────────────────────────────────┐
│ Tier 3: Utility Classes (Tailwind)                  │
│   bg-primary, text-foreground, rounded-lg           │
├─────────────────────────────────────────────────────┤
│ Tier 2: Semantic Tokens (@theme inline)             │
│   --color-primary: var(--primary)                   │
├─────────────────────────────────────────────────────┤
│ Tier 1: Base Tokens (:root / .dark)                 │
│   --primary: #d87943                                │
└─────────────────────────────────────────────────────┘
```

### Token Categories

| Category | Purpose | Example |
|----------|---------|---------|
| **Color** | Brand, semantic, neutral colors | `--primary`, `--destructive` |
| **Typography** | Font families, sizes, weights | `--font-sans`, `--text-base` |
| **Spacing** | Margins, padding, gaps | `--spacing-4`, 4px base unit |
| **Radius** | Border radius values | `--radius-lg`, `--radius-sm` |
| **Shadow** | Elevation and depth | `--shadow-sm`, `--shadow-lg` |

## Implementation Patterns

### Color Usage

```tsx
// ❌ WRONG - Hardcoded values
<div className="bg-[#0f6ecc] text-[#0d0d0d]">

// ❌ WRONG - Direct CSS with hardcoded values
<div style={{ backgroundColor: '#0f6ecc' }}>

// ✅ CORRECT - Tailwind utility classes
<div className="bg-primary text-foreground">

// ✅ CORRECT - CSS custom properties when needed
<div style={{ backgroundColor: 'var(--color-primary)' }}>

// ✅ BEST - Semantic color pairing
<div className="bg-primary text-primary-foreground">
```

### Spacing Usage

```tsx
// ❌ WRONG - Arbitrary pixels
<div className="p-[17px] mb-[23px]">

// ✅ CORRECT - Tailwind spacing scale (4px base)
<div className="p-4 mb-6">         {/* 16px, 24px */}
<div className="space-y-4 gap-6">  {/* Consistent vertical rhythm */}
```

### Typography Usage

```tsx
// ❌ WRONG - Hardcoded font sizes
<h1 style={{ fontSize: '36px' }}>

// ✅ CORRECT - Semantic typography
<h1 className="text-4xl font-bold tracking-tight">
<p className="text-base text-foreground">
<span className="text-sm text-muted-foreground">
```

## Component Styling Pattern

Use the `cn()` utility for conditional class merging:

```tsx
import { cn } from "@/lib/utils"

interface CardProps {
  variant?: "default" | "elevated"
  className?: string
}

function Card({ variant = "default", className }: CardProps) {
  return (
    <div className={cn(
      // Base styles
      "rounded-2xl border bg-card text-card-foreground p-4",
      // Variant styles
      variant === "elevated" && "shadow-lg",
      // User overrides
      className
    )}>
      {/* content */}
    </div>
  )
}
```

## Dark Mode Support

Semantic tokens handle theme switching automatically. Defined in `apps/web/src/app/globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #0d0d0d;
  --primary: #0f6ecc;
  --sidebar: #0d0d0d;  /* Dark sidebar even in light mode */
}

.dark {
  --background: #0d0d0d;
  --foreground: #f8f9fa;
  --primary: #0e63b9;
  --sidebar: #000000;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-sidebar: var(--sidebar);
}
```

Components using `bg-background` automatically switch between themes.

## Validation Checklist

Before merging UI code, verify:

- [ ] No hardcoded color values (`#xxx`, `rgb()`, `hsl()`)
- [ ] No hardcoded spacing outside Tailwind scale
- [ ] No hardcoded font sizes
- [ ] Semantic tokens used for colors
- [ ] Dark mode works without `dark:` overrides (semantic tokens handle it)
- [ ] Responsive design uses mobile-first approach
- [ ] Focus states visible for accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Used `cn()` utility for conditional classes

Manually verify: No hardcoded colors, spacing, or font sizes.

## Reference Files

Load these as needed for specific tasks:

| File | Use When |
|------|----------|
| [design-tokens-template.md](references/design-tokens-template.md) | Setting up or modifying design tokens |
| [component-patterns.md](references/component-patterns.md) | Creating UI components |
| [layout-spacing.md](references/layout-spacing.md) | Building layouts, managing spacing |
| [typography.md](references/typography.md) | Implementing text styles |
| [customization-guide.md](references/customization-guide.md) | Adapting skill to a new project |

## Project Configuration

For project-specific token customization, see [customization-guide.md](references/customization-guide.md).

## Common Tasks

### Adding a New Color Token

1. Add base token to `:root` and `.dark` in `globals.css`
2. Add semantic mapping in `@theme inline`
3. Document in PROJECT_CONFIG.md
4. Use via Tailwind utility: `bg-newcolor`

### Creating a New Component

1. Check [component-patterns.md](references/component-patterns.md) for existing patterns
2. Use semantic tokens for all colors
3. Apply consistent spacing with Tailwind scale
4. Include variant support via `cn()` utility
5. Test in both light and dark modes

### Auditing Existing Code

Search for hardcoded values in code:
- Hex colors: `#[0-9a-f]{3,8}`
- Arbitrary Tailwind: `bg-\[#`, `text-\[#`, `p-\[\d+px\]`
- Inline styles with pixels: `style={{...}}`

## Integration Notes

### With Tailwind CSS v4

- Use `@theme inline` for CSS variable mappings
- Tokens defined in `@theme` generate utility classes
- Access tokens via `var(--token-name)` or utility classes

### With shadcn/ui

- Components come pre-configured with tokens
- Extend via `className` prop and `cn()` utility
- Override tokens in `globals.css`, not component code

### With Next.js

- Server components use styling normally
- Client components need `'use client'` for interactions
- CSS custom properties work in both environments
