# CSS Variables & Theming Configuration

Complete guide to setting up CSS variables and theming with shadcn/ui and Tailwind CSS v4.

## globals.css Structure for Tailwind v4

The `app/globals.css` file is the central configuration for your theme. Here's the complete structure:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Key Sections Explained

### @import Directives

```css
@import "tailwindcss";
@import "tw-animate-css";
```

- `tailwindcss` - Core Tailwind v4 framework
- `tw-animate-css` - Animation utilities (replaces `tailwindcss-animate` from v3)

### @custom-variant

```css
@custom-variant dark (&:is(.dark *));
```

Defines custom variant for dark mode using class-based targeting. This ensures dark mode styles apply when `.dark` class is present on any parent element.

### :root and .dark Blocks

These define the actual color values:

```css
:root {
  --background: oklch(1 0 0);  /* Light background */
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);  /* Dark background */
  /* ... */
}
```

**Important**: 
- Use `oklch()` or `hsl()` color functions
- Values are wrapped in color functions (unlike v3)
- This enables proper color picker support in dev tools

### @theme inline Block

Maps your CSS variables to Tailwind-compatible names:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

**Naming Convention**:
- Colors: Prefix with `--color-`
- Radius: Prefix with `--radius-`
- This allows using Tailwind utilities like `bg-background`, `text-foreground`

### @layer base

Apply base styles to all elements:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Color Variables Reference

### Core Colors

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--background` | White | Near black | Main background |
| `--foreground` | Near black | White | Main text color |
| `--card` | White | Near black | Card backgrounds |
| `--card-foreground` | Near black | White | Card text |
| `--popover` | White | Near black | Popover backgrounds |
| `--popover-foreground` | Near black | White | Popover text |

### Semantic Colors

| Variable | Purpose | Usage |
|----------|---------|-------|
| `--primary` | Primary actions | Buttons, links |
| `--primary-foreground` | Primary text | Text on primary bg |
| `--secondary` | Secondary actions | Secondary buttons |
| `--secondary-foreground` | Secondary text | Text on secondary bg |
| `--muted` | Subtle backgrounds | Badges, table rows |
| `--muted-foreground` | Muted text | Helper text |
| `--accent` | Highlight elements | Hover states |
| `--accent-foreground` | Accent text | Text on accent bg |
| `--destructive` | Destructive actions | Delete buttons |
| `--destructive-foreground` | Destructive text | Text on destructive bg |

### UI Elements

| Variable | Purpose |
|----------|---------|
| `--border` | Border colors |
| `--input` | Input borders |
| `--ring` | Focus rings |

### Chart Colors

| Variable | Purpose |
|----------|---------|
| `--chart-1` through `--chart-5` | Chart/graph colors |

### Border Radius

| Variable | Size |
|----------|------|
| `--radius` | Base radius (0.625rem default) |
| `--radius-sm` | Small (base - 4px) |
| `--radius-md` | Medium (base - 2px) |
| `--radius-lg` | Large (base) |
| `--radius-xl` | Extra large (base + 4px) |

## Color Format: OKLCH vs HSL

Tailwind v4 with shadcn/ui supports both formats:

### OKLCH (Recommended)

```css
--background: oklch(1 0 0);  /* Lightness, Chroma, Hue */
```

**Benefits**:
- Perceptually uniform
- Better color interpolation
- Modern color space

### HSL (Alternative)

```css
--background: hsl(0 0% 100%);  /* Hue, Saturation, Lightness */
```

**Benefits**:
- More familiar
- Wider browser support
- Easy to understand

**Note**: Both work identically in Tailwind v4. Choose based on preference and browser requirements.

## Using CSS Variables in Components

### Via Tailwind Utilities

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

### Direct CSS Variable Access

```tsx
<div style={{ backgroundColor: 'var(--background)' }}>
  Content
</div>
```

### In Custom CSS

```css
.custom-component {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

## Migrating from Tailwind v3

### Key Differences

**Tailwind v3**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;  /* No color function */
  }
}
```

**Tailwind v4**:
```css
@import "tailwindcss";  /* Single import */

:root {
  --background: oklch(1 0 0);  /* With color function */
}

@theme inline {
  --color-background: var(--background);  /* Mapping */
}
```

### Migration Checklist

1. Replace `@tailwind` directives with `@import "tailwindcss"`
2. Wrap color values in `oklch()` or `hsl()`
3. Add `@theme inline` block with `--color-*` mappings
4. Move `:root` and `.dark` out of `@layer base`
5. Update animations to use `tw-animate-css`
6. Remove `tailwind.config.js` (optional, not needed for v4)

## Troubleshooting

### Colors not working

**Check**:
1. Color values wrapped in `oklch()` or `hsl()`
2. `@theme inline` mapping uses `--color-` prefix
3. Variable names match between `:root` and `@theme inline`

### Dark mode not switching

**Check**:
1. `@custom-variant dark` directive present
2. `.dark` class defined with dark colors
3. Theme provider configured (see dark-mode.md)
4. `suppressHydrationWarning` on `<html>` tag

### VSCode color picker not working

**Solution**: Ensure colors are wrapped in `oklch()` or `hsl()` functions in `:root` and `.dark` blocks. This enables proper color picker support.

### Build errors with @import

**Check**:
1. Using `@tailwindcss/postcss` plugin for Next.js
2. PostCSS config properly set up
3. Tailwind v4 installed (`npm install tailwindcss@latest`)
