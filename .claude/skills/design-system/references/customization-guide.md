# Customization Guide

How to adapt this design system skill for your specific project.

## Table of Contents

- [Setup Process](#setup-process)
- [Creating PROJECT_CONFIG.md](#creating-project_configmd)
- [Defining Design Tokens](#defining-design-tokens)
- [Framework Integration](#framework-integration)
- [Adding Custom Patterns](#adding-custom-patterns)
- [Validation Setup](#validation-setup)

## Setup Process

### Step 1: Copy Skill to Project

```bash
# Create skills directory if needed
mkdir -p .claude/skills

# Copy the template skill
cp -r design-system-template .claude/skills/design-system
```

### Step 2: Create Project Configuration

Create `PROJECT_CONFIG.md` in `.claude/skills/design-system/`:

```bash
touch .claude/skills/design-system/PROJECT_CONFIG.md
```

### Step 3: Define Your Tokens

Edit `PROJECT_CONFIG.md` with your project's design decisions.

### Step 4: Update globals.css

Apply tokens to your project's CSS file.

### Step 5: Test

Verify tokens work in both light and dark modes.

## Creating PROJECT_CONFIG.md

The `PROJECT_CONFIG.md` file documents your project's specific design decisions. This is the primary customization point.

### Template

```markdown
# [Project Name] Design Configuration

## Overview

Brief description of the project's visual identity and design goals.

## Brand Colors

### Primary
- Light: [HEX] - [Use case]
- Dark: [HEX] - [Use case]

### Secondary
- Light: [HEX] - [Use case]
- Dark: [HEX] - [Use case]

### Semantic Colors
- Success: [HEX]
- Warning: [HEX]
- Error: [HEX]
- Info: [HEX]

## Typography

### Font Families
- Sans: [Font name], [Fallback stack]
- Mono: [Font name], [Fallback stack]

### Font Loading
[How fonts are loaded - Google Fonts, local, etc.]

## Component Standards

### Cards
- Border radius: [e.g., rounded-2xl]
- Shadow: [e.g., shadow-sm]
- Padding: [e.g., p-4]

### Buttons
- Border radius: [e.g., rounded-lg]
- Default variant: [e.g., primary]

### Forms
- Field spacing: [e.g., space-y-2]
- Label style: [e.g., text-sm font-medium]

## Layout Standards

### Container
- Max width: [e.g., container or max-w-6xl]
- Padding: [e.g., px-4 md:px-6]

### Grid
- Column system: [e.g., 12-column]
- Default gap: [e.g., gap-4 lg:gap-6]

## Special Patterns

Document any project-specific patterns:
- [Pattern name]: [Description and usage]

## Accessibility Requirements

- Minimum contrast ratio: [e.g., WCAG AA]
- Focus indicators: [Style description]
- Motion preferences: [How to handle]
```

### Example: E-Commerce Project

```markdown
# ShopMax Design Configuration

## Overview

Modern e-commerce platform with a warm, approachable aesthetic.

## Brand Colors

### Primary
- Light: #E07A5F (Terracotta) - CTAs, links, focus states
- Dark: #F4A582 (Light Coral) - Adapted for dark backgrounds

### Secondary
- Light: #3D5A80 (Steel Blue) - Navigation, badges
- Dark: #81B4D8 (Light Steel) - Adapted for dark backgrounds

### Semantic Colors
- Success: #06D6A0 - Order confirmed, in stock
- Warning: #FFD166 - Low stock, pending
- Error: #EF476F - Errors, out of stock
- Info: #118AB2 - Information, tips

## Typography

### Font Families
- Sans: "Plus Jakarta Sans", system-ui, sans-serif
- Mono: "JetBrains Mono", monospace (order IDs)

### Font Loading
```tsx
import { Plus_Jakarta_Sans } from "next/font/google"
```

## Component Standards

### Product Cards
- Border radius: rounded-xl
- Shadow: shadow-sm hover:shadow-md
- Padding: p-4
- Image aspect: aspect-square

### Buttons
- Border radius: rounded-lg
- Primary: bg-primary text-primary-foreground
- Add to cart: Always primary variant, size lg

### Forms
- Field spacing: space-y-4
- Label: text-sm font-medium
- Input radius: rounded-md

## Special Patterns

### Price Display
```tsx
<span className="text-2xl font-bold text-foreground">$99.00</span>
<span className="text-sm text-muted-foreground line-through ml-2">$129.00</span>
```

### Stock Badge
```tsx
<span className="text-xs font-medium text-success">In Stock</span>
<span className="text-xs font-medium text-warning">Only 3 left</span>
<span className="text-xs font-medium text-destructive">Out of Stock</span>
```
```

## Defining Design Tokens

### Required Tokens

Every project needs these core tokens:

```css
:root {
  /* Required: Brand colors */
  --primary: /* value */;
  --primary-foreground: /* value */;
  --secondary: /* value */;
  --secondary-foreground: /* value */;
  
  /* Required: Neutrals */
  --background: /* value */;
  --foreground: /* value */;
  --muted: /* value */;
  --muted-foreground: /* value */;
  
  /* Required: Component colors */
  --card: /* value */;
  --card-foreground: /* value */;
  --border: /* value */;
  --input: /* value */;
  --ring: /* value */;
  
  /* Required: States */
  --destructive: /* value */;
  --destructive-foreground: /* value */;
  --accent: /* value */;
  --accent-foreground: /* value */;
}
```

### Optional Tokens

Add as needed for your project:

```css
:root {
  /* Success states */
  --success: /* value */;
  --success-foreground: /* value */;
  
  /* Warning states */
  --warning: /* value */;
  --warning-foreground: /* value */;
  
  /* Info states */
  --info: /* value */;
  --info-foreground: /* value */;
  
  /* Sidebar (if applicable) */
  --sidebar: /* value */;
  --sidebar-foreground: /* value */;
  
  /* Chart colors (if applicable) */
  --chart-1: /* value */;
  --chart-2: /* value */;
  /* etc. */
}
```

### Color Format Guidelines

**Recommended: HSL or OKLCH**

```css
/* HSL - Good browser support */
--primary: hsl(25 66% 55%);

/* OKLCH - Better color gamut (Tailwind v4 default) */
--primary: oklch(0.7 0.15 50);
```

**With Tailwind v4's @theme inline:**

```css
/* Base tokens can use any format */
:root {
  --primary: hsl(25 66% 55%);
}

/* @theme inline references the variable */
@theme inline {
  --color-primary: var(--primary);
}
```

## Framework Integration

### Next.js + Tailwind v4

```
app/
├── globals.css      # Token definitions
├── layout.tsx       # Font loading, theme provider
└── ...
```

**globals.css:**
```css
@import "tailwindcss";

:root { /* tokens */ }
.dark { /* dark tokens */ }

@theme inline { /* mappings */ }

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

**layout.tsx:**
```tsx
import { ThemeProvider } from "next-themes"
import "./globals.css"

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### With shadcn/ui

shadcn/ui components are pre-configured to use semantic tokens. After running `npx shadcn@latest init`:

1. Your tokens are in `app/globals.css`
2. Components use `bg-primary`, `text-foreground`, etc.
3. Update token values to match your brand

### Without shadcn/ui

Create your own `cn()` utility:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install dependencies:
```bash
npm install clsx tailwind-merge
```

## Adding Custom Patterns

### Project-Specific Components

Add custom patterns to a new reference file:

**.claude/skills/design-system/references/project-patterns.md**

```markdown
# [Project] Specific Patterns

## Product Card

```tsx
<div className="rounded-xl border bg-card overflow-hidden 
                transition-shadow hover:shadow-md">
  <div className="aspect-square">
    <img className="w-full h-full object-cover" />
  </div>
  <div className="p-4 space-y-2">
    <h3 className="font-semibold line-clamp-2">{title}</h3>
    <p className="text-lg font-bold">{price}</p>
  </div>
</div>
```

## [More patterns...]
```

### Update SKILL.md Reference Table

Add your new file to the reference table in SKILL.md:

```markdown
| [project-patterns.md](references/project-patterns.md) | Project-specific component patterns |
```

## Validation Setup

### Audit Script Configuration

Create a `.designsystem.json` in your project root:

```json
{
  "sourceDirs": ["src", "app", "components"],
  "excludeDirs": ["node_modules", ".next", "dist"],
  "fileExtensions": [".tsx", ".jsx", ".ts", ".js", ".css"],
  "rules": {
    "noHardcodedColors": true,
    "noHardcodedSpacing": true,
    "noHardcodedFontSizes": true,
    "requireSemanticTokens": true
  },
  "allowedArbitraryPatterns": [
    "\\[var\\(--",
    "\\[calc\\("
  ]
}
```

### Running Validation

```bash
# Run the audit
python .claude/skills/design-system/scripts/audit_styles.py src/

# Check specific file
python .claude/skills/design-system/scripts/audit_styles.py src/components/Button.tsx
```

### CI Integration

Add to your CI pipeline:

```yaml
# .github/workflows/design-system.yml
name: Design System Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.x'
      - run: python .claude/skills/design-system/scripts/audit_styles.py src/
```

## Migration Guide

### From Hardcoded Values

1. **Identify** hardcoded values with audit script
2. **Map** each value to a semantic token
3. **Replace** hardcoded values with tokens
4. **Test** in both light and dark modes

Example migration:

```tsx
// Before
<div className="bg-[#d87943] text-white p-[20px] rounded-[12px]">

// After
<div className="bg-primary text-primary-foreground p-5 rounded-xl">
```

### From CSS Variables to Semantic Tokens

If you have existing CSS variables:

```css
/* Before: Custom naming */
:root {
  --brand-orange: #d87943;
  --text-dark: #111827;
}

/* After: Semantic naming */
:root {
  --primary: #d87943;
  --foreground: #111827;
}

@theme inline {
  --color-primary: var(--primary);
  --color-foreground: var(--foreground);
}
```

## Checklist

Before considering setup complete:

- [ ] PROJECT_CONFIG.md created with all brand values
- [ ] All required tokens defined in globals.css
- [ ] Both `:root` and `.dark` sections populated
- [ ] `@theme inline` mappings added for Tailwind v4
- [ ] Font loading configured
- [ ] ThemeProvider set up for dark mode
- [ ] Test components render correctly
- [ ] Dark mode switches properly
- [ ] Audit script passes
- [ ] Documentation updated for team
