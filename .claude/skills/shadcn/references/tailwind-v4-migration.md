# Tailwind CSS v4 Migration Guide

Complete guide for upgrading existing shadcn/ui projects from Tailwind CSS v3 to v4.

## Overview

Tailwind v4 introduces major architectural changes:
- CSS-first configuration (goodbye `tailwind.config.js`)
- New `@import` and `@theme` directives
- OKLCH color space support
- Improved plugin system
- Faster build times

## Prerequisites

- Node.js 18+ installed
- Existing Next.js project with shadcn/ui and Tailwind v3
- Backup your project or commit changes to git

## Migration Steps

### Step 1: Update Dependencies

```bash
# Update Tailwind CSS
npm install tailwindcss@latest

# For Next.js projects
npm install @tailwindcss/postcss@latest

# Update animations
npm uninstall tailwindcss-animate
npm install tw-animate-css
```

### Step 2: Update PostCSS Configuration

Update `postcss.config.mjs` (or `.js`):

**Before (v3)**:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**After (v4)**:
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

### Step 3: Run Tailwind v4 Upgrade Tool

```bash
npx @tailwindcss/upgrade@next
```

This automated tool:
- Removes deprecated utility classes
- Updates `tailwind.config.js` settings
- Migrates CSS variables to `@theme` directive
- Updates component files

### Step 4: Update globals.css

**Before (v3)**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... other variables without color functions */
  }
  
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... */
  }
}
```

**After (v4)**:
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... wrapped in oklch() or hsl() */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... wrapped in oklch() or hsl() */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... prefixed with --color- */
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

### Step 5: Move CSS Variables Out of @layer base

CSS variables should NOT be inside `@layer base` anymore:

**Incorrect**:
```css
@layer base {
  :root {
    --background: oklch(1 0 0);
  }
}
```

**Correct**:
```css
:root {
  --background: oklch(1 0 0);
}

@layer base {
  body {
    @apply bg-background;
  }
}
```

### Step 6: Add @theme inline Block

Map your CSS variables to Tailwind-compatible names:

```css
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
  
  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

### Step 7: Wrap Color Values

All color values must be wrapped in color functions:

**HSL Format**:
```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
}
```

**OKLCH Format (Recommended)**:
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
```

### Step 8: Update components.json

Update your shadcn/ui configuration:

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",           // Leave empty for v4
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Key change**: Set `tailwind.config` to `""` (empty string) for v4.

### Step 9: Remove or Update tailwind.config.js

**Option A - Remove completely** (Recommended):
```bash
rm tailwind.config.js
```

**Option B - Keep for custom config**:

If you need JavaScript-based config, you can keep it and import in CSS:

```css
@config "./tailwind.config.js";
@import "tailwindcss";
```

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      // Your extensions
    },
  },
}
```

### Step 10: Update Components

Re-add components to get v4-compatible versions:

```bash
# Re-install all components
npx shadcn@latest add
```

Or selectively update:

```bash
npx shadcn@latest add button card dialog
```

### Step 11: Test Your Application

```bash
npm run dev
```

Check for:
- CSS building without errors
- All colors displaying correctly
- Dark mode working
- Animations functioning
- No console warnings

## Color Conversion

### HSL to OKLCH Conversion

Use online converters or tools to convert HSL to OKLCH:

**HSL**:
```css
--primary: hsl(222.2 47.4% 11.2%);
```

**OKLCH**:
```css
--primary: oklch(0.205 0.048 264.376);
```

### Manual Conversion

For approximate conversion:
- Lightness: HSL L% → OKLCH L (0-1)
- Chroma: HSL S × L → OKLCH C (0-0.4)
- Hue: HSL H → OKLCH H (degrees)

## Breaking Changes

### Removed Utilities

Some utilities were removed or renamed:

| v3 Utility | v4 Replacement |
|-----------|----------------|
| `bg-opacity-50` | `bg-primary/50` |
| `transform` | Automatic |
| `filter` | Automatic |
| `backdrop-filter` | Automatic |

### Changed Defaults

| Property | v3 Default | v4 Default |
|----------|-----------|------------|
| Border color | `border-gray-200` | `currentColor` |
| Cursor on buttons | `cursor-pointer` | `cursor-default` |

### Restore Pointer Cursor

If you want pointer cursor on buttons:

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

## Animation Migration

### Old (tailwindcss-animate)

```javascript
// tailwind.config.js
export default {
  plugins: [require("tailwindcss-animate")],
}
```

### New (tw-animate-css)

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";
```

```bash
npm uninstall tailwindcss-animate
npm install tw-animate-css
```

## Plugin Migration

### Old Plugin Format

```javascript
// tailwind.config.js
export default {
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### New Plugin Format

```css
/* globals.css */
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

## Common Issues

### Issue: Colors not working

**Problem**: Variables not wrapped in color functions

**Solution**: Wrap all color values in `oklch()` or `hsl()`:
```css
/* Wrong */
--background: 0 0% 100%;

/* Correct */
--background: oklch(1 0 0);
```

### Issue: Build fails

**Problem**: Old PostCSS config

**Solution**: Update to use `@tailwindcss/postcss`:
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

### Issue: Dark mode not working

**Problem**: Missing `@custom-variant` directive

**Solution**: Add to top of globals.css:
```css
@custom-variant dark (&:is(.dark *));
```

### Issue: Components look different

**Problem**: Old component versions

**Solution**: Re-add components:
```bash
npx shadcn@latest add button --overwrite
```

### Issue: Animations not working

**Problem**: Still using `tailwindcss-animate`

**Solution**: Switch to `tw-animate-css`:
```bash
npm uninstall tailwindcss-animate
npm install tw-animate-css
```

Add to globals.css:
```css
@import "tw-animate-css";
```

## Verification Checklist

After migration, verify:

- [ ] Build succeeds without errors
- [ ] All pages render correctly
- [ ] Colors match original design
- [ ] Dark mode toggles properly
- [ ] Animations work
- [ ] Responsive design intact
- [ ] Forms function correctly
- [ ] No console warnings
- [ ] Production build works
- [ ] All custom utilities work

## Rollback Plan

If issues arise:

### Quick Rollback

```bash
# Revert to v3
npm install tailwindcss@3 autoprefixer
npm install tailwindcss-animate
npm uninstall @tailwindcss/postcss tw-animate-css

# Restore git backup
git checkout HEAD -- app/globals.css postcss.config.mjs
```

### Gradual Migration

Instead of full migration, run v3 and v4 side-by-side:

```css
/* Use v3 with explicit config */
@config "./tailwind.v3.config.js";
```

Test new features before full switch.

## Benefits of v4

After successful migration:
- Faster build times (up to 3x)
- Better color consistency (OKLCH)
- Simpler configuration
- Improved developer experience
- Smaller CSS output
- Better tree-shaking

## Resources

- [Official Tailwind v4 Docs](https://tailwindcss.com/docs/v4-upgrade-guide)
- [shadcn/ui v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [OKLCH Color Picker](https://oklch.com/)
- [HSL to OKLCH Converter](https://converter.oklch.com/)

## Getting Help

If stuck during migration:
1. Check [shadcn/ui GitHub Issues](https://github.com/shadcn-ui/ui/issues)
2. Review [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
3. Ask in [shadcn/ui Discord](https://discord.gg/shadcn)
