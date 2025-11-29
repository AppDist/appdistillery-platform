# CSS-First Configuration (Tailwind CSS v4)

Complete guide to configuring Tailwind CSS v4 using the new CSS-first approach.

## Key Changes from v3

**v3 (JavaScript config)**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#4f46e5'
      }
    }
  }
}
```

**v4 (CSS config)**:
```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-brand: #4f46e5;
}
```

## Basic Theme Configuration

### Colors

Define custom colors using CSS variables:

```css
@import "tailwindcss";

@theme {
  /* Custom colors */
  --color-brand-primary: #4f46e5;
  --color-brand-secondary: #7c3aed;
  --color-brand-accent: #ec4899;
  
  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

Usage:

```jsx
<div className="bg-brand-primary text-white">
  Uses custom color
</div>

<button className="bg-success hover:bg-success/90">
  Success button
</button>
```

### Typography

Configure fonts and font sizes:

```css
@import "tailwindcss";

@theme {
  /* Font families */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-serif: "Georgia", serif;
  --font-mono: "Fira Code", monospace;
  
  /* Font sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
}
```

Usage:

```jsx
<p className="font-sans text-base">
  Body text in Inter
</p>

<code className="font-mono text-sm">
  Code in Fira Code
</code>
```

### Spacing

Customize spacing scale:

```css
@import "tailwindcss";

@theme {
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
}
```

### Border Radius

Define custom radius values:

```css
@import "tailwindcss";

@theme {
  --radius-none: 0;
  --radius-sm: 0.125rem;
  --radius-DEFAULT: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Component-specific */
  --radius-button: 0.5rem;
  --radius-card: 0.75rem;
  --radius-input: 0.375rem;
}
```

Usage:

```jsx
<button className="rounded-button">
  Uses custom button radius
</button>

<div className="rounded-card">
  Uses card radius
</div>
```

### Shadows

Custom shadow definitions:

```css
@import "tailwindcss";

@theme {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-DEFAULT: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  
  /* Custom shadows */
  --shadow-glow: 0 0 20px rgb(59 130 246 / 0.5);
  --shadow-card: 0 2px 8px rgb(0 0 0 / 0.1);
}
```

## Advanced Configuration

### Breakpoints

Customize responsive breakpoints:

```css
@import "tailwindcss";

@theme {
  --breakpoint-sm: 40rem;     /* 640px */
  --breakpoint-md: 48rem;     /* 768px */
  --breakpoint-lg: 64rem;     /* 1024px */
  --breakpoint-xl: 80rem;     /* 1280px */
  --breakpoint-2xl: 96rem;    /* 1536px */
  
  /* Custom breakpoints */
  --breakpoint-tablet: 48rem;
  --breakpoint-desktop: 75rem;
}
```

### Container Sizes

Configure container max-widths:

```css
@import "tailwindcss";

@theme {
  --container-sm: 40rem;
  --container-md: 48rem;
  --container-lg: 64rem;
  --container-xl: 80rem;
  --container-2xl: 96rem;
}
```

### Animation

Custom animations:

```css
@import "tailwindcss";

@theme {
  /* Animation durations */
  --animate-duration-fast: 150ms;
  --animate-duration-base: 300ms;
  --animate-duration-slow: 500ms;
  
  /* Animation timing functions */
  --animate-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --animate-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --animate-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Z-Index

Custom z-index scale:

```css
@import "tailwindcss";

@theme {
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  
  /* Semantic z-indexes */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

## Custom Utilities

### Creating Custom Utility Classes

Use `@utility` to create custom utilities:

```css
@import "tailwindcss";

@utility btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  transition: all 150ms;
}

@utility btn-primary {
  background-color: theme(--color-blue-500);
  color: white;
}

@utility btn-primary:hover {
  background-color: theme(--color-blue-600);
}
```

Usage:

```jsx
<button className="btn btn-primary">
  Custom utility button
</button>
```

### Component Styles

```css
@import "tailwindcss";

@utility card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

@utility card-header {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
```

Usage:

```jsx
<div className="card">
  <h2 className="card-header">Title</h2>
  <p>Content</p>
</div>
```

## Custom Variants

### Data Attribute Variants

```css
@import "tailwindcss";

@custom-variant active (&:is([data-active], [data-active] *));
@custom-variant inactive (&:is([data-inactive], [data-inactive] *));
```

Usage:

```jsx
<div data-active className="bg-blue-500 active:bg-blue-600">
  Active variant
</div>
```

### Aria Variants

```css
@import "tailwindcss";

@custom-variant aria-expanded (&:is([aria-expanded="true"], [aria-expanded="true"] *));
@custom-variant aria-disabled (&:is([aria-disabled="true"], [aria-disabled="true"] *));
```

Usage:

```jsx
<button 
  aria-expanded={isOpen}
  className="bg-white aria-expanded:bg-blue-50"
>
  Expandable
</button>
```

### Group Variants

```css
@import "tailwindcss";

@custom-variant group-active (.group:is([data-active]) &);
```

Usage:

```jsx
<div className="group" data-active>
  <span className="text-gray-700 group-active:text-blue-700">
    Changes when parent is active
  </span>
</div>
```

## Plugins

### Creating Custom Plugins

```css
@import "tailwindcss";

@plugin {
  /* Add custom CSS here */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: theme(--color-gray-100);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: theme(--color-gray-400);
    border-radius: 4px;
  }
}
```

### Typography Plugin

```css
@import "tailwindcss";
@import "tailwindcss-typography";

@theme {
  --typography-body-color: theme(--color-gray-700);
  --typography-heading-color: theme(--color-gray-900);
}
```

## Dark Mode Configuration

Configure dark mode colors:

```css
@import "tailwindcss";

@theme {
  /* Light mode colors */
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-muted: #6b7280;
}

@media (prefers-color-scheme: dark) {
  @theme {
    /* Dark mode colors */
    --color-background: #1a1a1a;
    --color-foreground: #ffffff;
    --color-muted: #9ca3af;
  }
}
```

For class-based dark mode:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: #ffffff;
  --color-foreground: #000000;
}

.dark {
  --color-background: #1a1a1a;
  --color-foreground: #ffffff;
}
```

## Source Configuration

Control which files Tailwind scans:

```css
@import "tailwindcss";

/* Automatically scans common patterns by default */
/* Manual configuration if needed: */
@source "../../packages/**/src/**/*.{js,jsx,ts,tsx}";
@source "../shared-components/**/*.{js,jsx,ts,tsx}";
```

## Import Order

Recommended import order in your CSS file:

```css
/* 1. Tailwind base styles */
@import "tailwindcss";

/* 2. Plugins */
@import "tailwindcss-animate";

/* 3. Custom variants */
@custom-variant dark (&:where(.dark, .dark *));

/* 4. Theme configuration */
@theme {
  /* Your theme variables */
}

/* 5. Custom utilities */
@utility btn {
  /* Your custom utilities */
}

/* 6. Global custom CSS */
body {
  font-family: var(--font-sans);
}
```

## Loading External Fonts

```css
@import "tailwindcss";

/* Load fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
}
```

Or with Next.js font optimization:

```jsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Prefixes

Add a prefix to all Tailwind classes:

```css
@import "tailwindcss" prefix(tw-);
```

Usage:

```jsx
<div className="tw-flex tw-items-center tw-gap-4">
  Prefixed classes
</div>
```

## Important Modifier

Make all utilities !important:

```css
@import "tailwindcss" important;
```

Or with a selector:

```css
@import "tailwindcss" important(#app);
```

## Migration from v3

### JavaScript Config Still Supported

For backward compatibility, you can still use JavaScript config:

```css
@import "tailwindcss";
@config "./tailwind.config.js";
```

But v4 recommends CSS-first configuration for:
- Better performance
- Easier to understand
- More maintainable
- Type-safe with CSS variables

## Best Practices

### 1. Use Semantic Variable Names

```css
/* ✅ Good: Semantic names */
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-accent: #8b5cf6;
}

/* ❌ Bad: Non-semantic names */
@theme {
  --color-blue: #3b82f6;
  --color-gray: #6b7280;
  --color-purple: #8b5cf6;
}
```

### 2. Organize Theme Variables by Category

```css
@theme {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  
  /* Typography */
  --font-sans: "Inter", sans-serif;
  --font-mono: "Fira Code", monospace;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  
  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

### 3. Use CSS Variables for Dynamic Values

```css
@theme {
  --color-brand: #3b82f6;
  --color-brand-hover: color-mix(in srgb, var(--color-brand) 90%, black);
}
```

### 4. Document Your Configuration

```css
@import "tailwindcss";

@theme {
  /* Brand Colors - From design system v2.0 */
  --color-brand-primary: #4f46e5;  /* Indigo 600 */
  --color-brand-secondary: #7c3aed; /* Purple 600 */
  
  /* Component-specific spacing - 8px grid system */
  --spacing-component: 0.5rem;  /* 8px */
  --spacing-section: 2rem;      /* 32px */
}
```

## Troubleshooting

### Configuration Not Working

1. Check import statement: `@import "tailwindcss";`
2. Verify PostCSS config has `@tailwindcss/postcss`
3. Restart dev server after configuration changes
4. Check browser console for CSS errors

### Theme Variables Not Available

Ensure variables are defined in `@theme` block:

```css
/* ❌ Wrong */
:root {
  --color-brand: #3b82f6;
}

/* ✅ Correct */
@theme {
  --color-brand: #3b82f6;
}
```

### Syntax Errors

Use correct CSS variable syntax:

```css
/* ❌ Wrong */
@theme {
  color-brand: #3b82f6;
}

/* ✅ Correct */
@theme {
  --color-brand: #3b82f6;
}
```
