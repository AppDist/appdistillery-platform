# Design Tokens Template

Template for defining and organizing design tokens. Copy and customize for your project.

## Table of Contents

- [Token Structure](#token-structure)
- [Color Tokens](#color-tokens)
- [Typography Tokens](#typography-tokens)
- [Spacing Tokens](#spacing-tokens)
- [Border Radius Tokens](#border-radius-tokens)
- [Shadow Tokens](#shadow-tokens)
- [Tailwind CSS v4 Integration](#tailwind-css-v4-integration)

## Token Structure

### File Organization

```
app/
├── globals.css          # Token definitions
├── layout.tsx           # Font imports
└── ...

tailwind.config.ts       # (Optional for v4, can use CSS-only)
```

### Three-Tier Architecture

```css
/* Tier 1: Base Tokens - Raw values */
:root {
  --primary: #d87943;
  --background: #ffffff;
}

.dark {
  --primary: #e78a53;
  --background: #121113;
}

/* Tier 2: Semantic Mapping - Tailwind v4 @theme */
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
}

/* Tier 3: Utility Classes - Auto-generated */
/* bg-primary, text-background, etc. */
```

## Color Tokens

### Template Structure

```css
/* ================================================
   COLOR TOKENS - globals.css
   ================================================ */

:root {
  /* -------------------- Brand Colors -------------------- */
  --primary: /* YOUR_PRIMARY_COLOR */;
  --primary-foreground: /* TEXT_ON_PRIMARY */;
  
  --secondary: /* YOUR_SECONDARY_COLOR */;
  --secondary-foreground: /* TEXT_ON_SECONDARY */;

  /* -------------------- Neutral Colors -------------------- */
  --background: /* PAGE_BACKGROUND */;
  --foreground: /* PRIMARY_TEXT */;
  
  --muted: /* SUBTLE_BACKGROUND */;
  --muted-foreground: /* SECONDARY_TEXT */;
  
  --accent: /* HOVER_HIGHLIGHT */;
  --accent-foreground: /* TEXT_ON_ACCENT */;

  /* -------------------- Component Colors -------------------- */
  --card: /* CARD_BACKGROUND */;
  --card-foreground: /* CARD_TEXT */;
  
  --popover: /* POPOVER_BACKGROUND */;
  --popover-foreground: /* POPOVER_TEXT */;
  
  --border: /* BORDER_COLOR */;
  --input: /* INPUT_BORDER */;
  --ring: /* FOCUS_RING */;

  /* -------------------- State Colors -------------------- */
  --destructive: /* ERROR_COLOR */;
  --destructive-foreground: /* TEXT_ON_ERROR */;
  
  /* Optional: Add success, warning, info as needed */
  /* --success: #10b981; */
  /* --warning: #f59e0b; */
  /* --info: #3b82f6; */

  /* -------------------- Chart Colors -------------------- */
  --chart-1: /* DATA_VIZ_1 */;
  --chart-2: /* DATA_VIZ_2 */;
  --chart-3: /* DATA_VIZ_3 */;
  --chart-4: /* DATA_VIZ_4 */;
  --chart-5: /* DATA_VIZ_5 */;
}

.dark {
  /* Repeat all tokens with dark mode values */
  --primary: /* DARK_PRIMARY */;
  --primary-foreground: /* DARK_TEXT_ON_PRIMARY */;
  /* ... */
}
```

### Semantic Color Mapping (Tailwind v4)

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
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}
```

### Color Pairing Rules

Always pair background with its foreground token:

| Background | Foreground | Use Case |
|------------|------------|----------|
| `bg-background` | `text-foreground` | Page content |
| `bg-primary` | `text-primary-foreground` | Primary buttons |
| `bg-secondary` | `text-secondary-foreground` | Secondary buttons |
| `bg-muted` | `text-muted-foreground` | Subtle sections |
| `bg-accent` | `text-accent-foreground` | Hover states |
| `bg-card` | `text-card-foreground` | Card content |
| `bg-destructive` | `text-destructive-foreground` | Error states |

## Typography Tokens

### Font Family Template

```css
:root {
  /* Define font stacks */
  --font-sans: /* YOUR_SANS_FONT */, ui-sans-serif, system-ui, sans-serif;
  --font-mono: /* YOUR_MONO_FONT */, ui-monospace, monospace;
  --font-serif: /* YOUR_SERIF_FONT */, ui-serif, Georgia, serif;
}

@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);
}
```

### Font Loading (Next.js)

```tsx
// app/layout.tsx
import { Geist_Mono, JetBrains_Mono } from "next/font/google"

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({ children }) {
  return (
    <html className={`${geistMono.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Letter Spacing Template

```css
:root {
  --tracking-normal: 0rem;
  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}
```

## Spacing Tokens

### Base Spacing Unit

```css
:root {
  --spacing: 0.25rem; /* 4px base unit */
}
```

### Spacing Scale Reference

Use Tailwind's default scale (based on 4px unit):

| Value | Pixels | Common Use |
|-------|--------|------------|
| `1` | 4px | Micro spacing |
| `2` | 8px | Small gaps |
| `3` | 12px | Medium-small |
| `4` | 16px | **Standard** |
| `5` | 20px | Medium |
| `6` | 24px | Large |
| `8` | 32px | Section spacing |
| `10` | 40px | Large sections |
| `12` | 48px | Major sections |
| `16` | 64px | Hero sections |

### Usage Patterns

```tsx
// Component internal spacing
<div className="p-4 space-y-3">       {/* 16px padding, 12px gaps */}

// Section spacing
<section className="py-12 lg:py-20">  {/* Responsive vertical padding */}

// Layout gaps
<div className="grid gap-4 lg:gap-6"> {/* Responsive grid gaps */}
```

## Border Radius Tokens

### Template

```css
:root {
  --radius: 0.75rem; /* Base radius: 12px */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

### Usage Guidelines

| Token | Pixels | Use Case |
|-------|--------|----------|
| `rounded-sm` | ~8px | Small elements, badges |
| `rounded` | 4px | Default Tailwind |
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Cards, medium elements |
| `rounded-xl` | 12px | Large cards |
| `rounded-2xl` | 16px | Hero cards, panels |
| `rounded-full` | 50% | Avatars, pills |

## Shadow Tokens

### Template

```css
:root {
  /* Shadow configuration */
  --shadow-opacity: 0.05;
  --shadow-color: #000000;

  /* Shadow scale */
  --shadow-2xs: 0px 1px 4px 0px hsl(0 0% 0% / 0.03);
  --shadow-xs: 0px 1px 4px 0px hsl(0 0% 0% / 0.03);
  --shadow-sm: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 
               0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 
            0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow-md: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 
               0px 2px 4px -1px hsl(0 0% 0% / 0.05);
  --shadow-lg: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 
               0px 4px 6px -1px hsl(0 0% 0% / 0.05);
  --shadow-xl: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 
               0px 8px 10px -1px hsl(0 0% 0% / 0.05);
  --shadow-2xl: 0px 1px 4px 0px hsl(0 0% 0% / 0.13);
}
```

### Usage Guidelines

| Class | Elevation | Use Case |
|-------|-----------|----------|
| `shadow-none` | 0 | Flat elements |
| `shadow-sm` | Low | Default cards |
| `shadow` | Standard | Interactive cards |
| `shadow-md` | Medium | Elevated cards |
| `shadow-lg` | High | Popovers, dropdowns |
| `shadow-xl` | Very high | Modals, dialogs |
| `shadow-2xl` | Maximum | Floating elements |

## Tailwind CSS v4 Integration

### Complete globals.css Template

```css
@import "tailwindcss";

/* ================================================
   BASE TOKENS
   ================================================ */

:root {
  /* Colors */
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  --primary: hsl(25 66% 55%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(180 19% 40%);
  --secondary-foreground: hsl(0 0% 100%);
  --muted: hsl(220 14% 96%);
  --muted-foreground: hsl(220 9% 46%);
  --accent: hsl(220 14% 93%);
  --accent-foreground: hsl(0 0% 3.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(0 0% 3.9%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(0 0% 3.9%);
  --border: hsl(220 13% 91%);
  --input: hsl(220 13% 91%);
  --ring: hsl(25 66% 55%);
  --destructive: hsl(0 84% 60%);
  --destructive-foreground: hsl(0 0% 98%);
  
  /* Chart colors */
  --chart-1: hsl(180 24% 45%);
  --chart-2: hsl(25 78% 62%);
  --chart-3: hsl(35 93% 79%);
  --chart-4: hsl(0 0% 53%);
  --chart-5: hsl(0 0% 60%);
  
  /* Typography */
  --font-sans: system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  
  /* Spacing */
  --spacing: 0.25rem;
  
  /* Radius */
  --radius: 0.75rem;
}

.dark {
  --background: hsl(0 0% 7%);
  --foreground: hsl(0 0% 76%);
  --primary: hsl(25 78% 62%);
  --primary-foreground: hsl(0 0% 7%);
  --secondary: hsl(165 100% 16%);
  --secondary-foreground: hsl(240 6% 90%);
  --muted: hsl(0 0% 13%);
  --muted-foreground: hsl(0 0% 53%);
  --accent: hsl(0 0% 20%);
  --accent-foreground: hsl(0 0% 76%);
  --card: hsl(0 0% 7%);
  --card-foreground: hsl(0 0% 76%);
  --popover: hsl(0 0% 7%);
  --popover-foreground: hsl(0 0% 76%);
  --border: hsl(0 0% 13%);
  --input: hsl(0 0% 13%);
  --ring: hsl(25 78% 62%);
  --destructive: hsl(180 24% 45%);
  --destructive-foreground: hsl(0 0% 7%);
}

/* ================================================
   SEMANTIC MAPPING (Tailwind v4)
   ================================================ */

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
  
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* ================================================
   BASE STYLES
   ================================================ */

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "cv11", "ss01";
  }
}
```

## Adding New Tokens

### Process

1. **Define base token** in `:root` and `.dark`:
   ```css
   :root { --success: #10b981; }
   .dark { --success: #34d399; }
   ```

2. **Add semantic mapping** in `@theme inline`:
   ```css
   @theme inline {
     --color-success: var(--success);
   }
   ```

3. **Document** in PROJECT_CONFIG.md

4. **Use** via Tailwind utility:
   ```tsx
   <div className="bg-success text-success-foreground">
   ```

### Validation

After adding tokens, verify:
- Token exists in both `:root` and `.dark`
- Mapping exists in `@theme inline`
- Utility classes work: `bg-tokenname`, `text-tokenname`
- Documentation updated
