# Theming Guide

Complete guide to customizing colors, creating custom themes, and managing theme variants in shadcn/ui.

## Adding Custom Colors

### Step 1: Define CSS Variables

Add your custom colors to `app/globals.css`:

```css
:root {
  /* Existing variables... */
  
  /* Custom brand colors */
  --brand: oklch(0.488 0.243 264.376);
  --brand-foreground: oklch(0.985 0 0);
  --success: oklch(0.696 0.17 162.48);
  --success-foreground: oklch(0.145 0 0);
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.145 0 0);
}

.dark {
  /* Existing dark variables... */
  
  /* Custom brand colors - dark mode */
  --brand: oklch(0.588 0.243 264.376);
  --brand-foreground: oklch(0.985 0 0);
  --success: oklch(0.596 0.17 162.48);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.728 0.189 84.429);
  --warning-foreground: oklch(0.145 0 0);
}
```

### Step 2: Map to Tailwind

Add mappings in `@theme inline` block:

```css
@theme inline {
  /* Existing mappings... */
  
  /* Custom color mappings */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### Step 3: Use in Components

```tsx
// Using Tailwind utilities
<button className="bg-brand text-brand-foreground hover:bg-brand/90">
  Brand Button
</button>

<div className="bg-success text-success-foreground p-4 rounded-lg">
  Success message
</div>

<div className="border-warning text-warning">
  Warning text
</div>
```

## Creating Component Variants

### Adding Button Variant

Edit `components/ui/button.tsx`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Add custom variants
        brand: "bg-brand text-brand-foreground shadow hover:bg-brand/90",
        success: "bg-success text-success-foreground shadow hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow hover:bg-warning/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

Usage:

```tsx
<Button variant="brand">Brand Action</Button>
<Button variant="success">Success Action</Button>
<Button variant="warning">Warning Action</Button>
```

## Base Color Themes

shadcn/ui supports multiple base color palettes. Choose during initialization or switch later.

### Available Base Colors

| Color | Description | Use Case |
|-------|-------------|----------|
| `neutral` | Balanced grays | General purpose, professional |
| `slate` | Cool grays | Modern, tech-focused |
| `zinc` | Warm grays | Elegant, sophisticated |
| `stone` | Natural grays | Organic, earthy |
| `gray` | True grays | Classic, minimal |

### Switching Base Colors

1. Update `components.json`:

```json
{
  "tailwind": {
    "baseColor": "slate"
  }
}
```

2. Regenerate CSS variables:

```bash
npx shadcn@latest init --force
```

**Warning**: This regenerates your `globals.css`. Back up custom modifications first.

## Creating Multiple Themes

### Theme Switching with CSS Classes

Define multiple theme classes:

```css
:root {
  /* Default theme */
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  /* ... other variables */
}

[data-theme="ocean"] {
  --background: oklch(0.98 0.01 220);
  --primary: oklch(0.45 0.15 220);
  --accent: oklch(0.65 0.12 180);
  /* ... theme-specific colors */
}

[data-theme="forest"] {
  --background: oklch(0.98 0.01 140);
  --primary: oklch(0.35 0.12 140);
  --accent: oklch(0.55 0.10 120);
  /* ... theme-specific colors */
}

.dark[data-theme="ocean"] {
  --background: oklch(0.15 0.01 220);
  --primary: oklch(0.55 0.15 220);
  /* ... dark ocean theme */
}
```

### Theme Switcher Component

```tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  { name: "Default", value: null },
  { name: "Ocean", value: "ocean" },
  { name: "Forest", value: "forest" },
]

export function ThemeSwitcher() {
  const [theme, setTheme] = React.useState<string | null>(null)

  React.useEffect(() => {
    const root = document.documentElement
    if (theme) {
      root.setAttribute("data-theme", theme)
    } else {
      root.removeAttribute("data-theme")
    }
  }, [theme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Theme: {themes.find(t => t.value === theme)?.name || "Default"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {themes.map((t) => (
          <DropdownMenuItem key={t.name} onClick={() => setTheme(t.value)}>
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Typography Theming

### Custom Fonts

1. Install fonts (Google Fonts example):

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

2. Configure in CSS:

```css
@theme inline {
  /* ... existing theme */
  
  --font-sans: var(--font-sans), ui-sans-serif, system-ui;
  --font-mono: var(--font-mono), ui-monospace, monospace;
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
  
  code, pre {
    font-family: var(--font-mono);
  }
}
```

### Font Size Scale

Add custom font sizes:

```css
@theme inline {
  /* ... existing theme */
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
}
```

## Spacing & Sizing

### Custom Border Radius

Override default radius:

```css
:root {
  --radius: 0.5rem;  /* Default */
  /* or */
  --radius: 0rem;    /* Sharp corners */
  /* or */
  --radius: 1rem;    /* Rounded */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}
```

### Component-Specific Sizing

```css
@theme inline {
  /* Button heights */
  --button-height-sm: 2rem;
  --button-height-md: 2.5rem;
  --button-height-lg: 3rem;
  
  /* Input heights */
  --input-height: 2.5rem;
  
  /* Card padding */
  --card-padding: 1.5rem;
}
```

## Advanced: CSS Variable Patterns

### Semantic Color System

```css
:root {
  /* Base colors */
  --blue-50: oklch(0.97 0.01 240);
  --blue-500: oklch(0.55 0.15 240);
  --blue-900: oklch(0.25 0.08 240);
  
  /* Semantic mapping */
  --info: var(--blue-500);
  --info-foreground: oklch(0.99 0 0);
  --info-light: var(--blue-50);
  --info-dark: var(--blue-900);
}

@theme inline {
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-info-light: var(--info-light);
  --color-info-dark: var(--info-dark);
}
```

### State-Based Colors

```css
:root {
  /* Default state */
  --button-bg: var(--primary);
  --button-fg: var(--primary-foreground);
  
  /* Hover state */
  --button-hover-bg: oklch(from var(--primary) l c h / 0.9);
  
  /* Active state */
  --button-active-bg: oklch(from var(--primary) l c h / 0.8);
  
  /* Disabled state */
  --button-disabled-bg: oklch(from var(--primary) l c h / 0.5);
}
```

## Theme Generator Tool

### Quick Theme from Brand Color

```typescript
// lib/generate-theme.ts
import tinycolor from 'tinycolor2'

export function generateTheme(brandColor: string) {
  const base = tinycolor(brandColor)
  
  return {
    primary: brandColor,
    'primary-foreground': base.isLight() ? '#000000' : '#ffffff',
    secondary: base.spin(30).toHexString(),
    accent: base.spin(-30).toHexString(),
    // ... generate other colors
  }
}
```

## Best Practices

1. **Maintain Contrast**: Ensure text is readable on all backgrounds (WCAG AA: 4.5:1, AAA: 7:1)
2. **Consistent Naming**: Use semantic names (`--success`, not `--green`)
3. **Test Both Modes**: Verify colors work in light and dark mode
4. **Use Color Functions**: Prefer `oklch()` for perceptual uniformity
5. **Document Custom Themes**: Keep a reference of custom color meanings
6. **Version Control**: Track theme changes in git
7. **Gradual Changes**: Test theme modifications with users before full rollout

## Testing Themes

### Contrast Checker

```tsx
// components/contrast-checker.tsx
"use client"

import { useState } from "react"

export function ContrastChecker() {
  const [bg, setBg] = useState("#ffffff")
  const [fg, setFg] = useState("#000000")
  
  // Calculate contrast ratio
  const getContrast = (bg: string, fg: string) => {
    // Implementation using color libraries
  }
  
  return (
    <div>
      <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
      <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
      <div style={{ background: bg, color: fg }}>
        Sample Text (Ratio: {getContrast(bg, fg)})
      </div>
    </div>
  )
}
```

### Theme Preview Component

```tsx
// components/theme-preview.tsx
export function ThemePreview() {
  return (
    <div className="space-y-4 p-8">
      <div className="bg-background text-foreground p-4 rounded-lg border">
        Background / Foreground
      </div>
      <div className="bg-card text-card-foreground p-4 rounded-lg border">
        Card / Card Foreground
      </div>
      <div className="bg-primary text-primary-foreground p-4 rounded-lg">
        Primary / Primary Foreground
      </div>
      <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
        Secondary / Secondary Foreground
      </div>
      <div className="bg-muted text-muted-foreground p-4 rounded-lg">
        Muted / Muted Foreground
      </div>
      <div className="bg-accent text-accent-foreground p-4 rounded-lg">
        Accent / Accent Foreground
      </div>
      <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
        Destructive / Destructive Foreground
      </div>
    </div>
  )
}
```
