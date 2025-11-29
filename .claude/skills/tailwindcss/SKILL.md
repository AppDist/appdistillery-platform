---
name: tailwindcss
description: Expert guidance for styling with Tailwind CSS v4 in modern web projects. Use when building UIs with Tailwind CSS, creating responsive designs, implementing dark mode, or working with utility classes in HTML, JSX, React, Next.js, or other frameworks. Covers v4-specific features including CSS-first configuration, new utilities, responsive design patterns, and best practices. (project)
---

# Tailwind CSS v4 Styling

Expert guidance for building modern UIs with Tailwind CSS v4. This skill covers installation, configuration, utility usage, responsive design, dark mode, and best practices for v4.

## Version Information

**Current Version**: Tailwind CSS v4.0+ (stable as of January 2025)
**Next.js Compatibility**: Full support for Next.js 15.x
**Breaking Changes**: v4 introduces CSS-first configuration and removes JavaScript config files

## Quick Start

### Installation for Next.js 15

```bash
# Create new Next.js project (choose "No" for Tailwind during setup)
npx create-next-app@latest my-project --typescript --eslint --app
cd my-project

# Install Tailwind v4
npm install tailwindcss @tailwindcss/postcss postcss
```

### PostCSS Configuration

Create or update `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### CSS Setup

In your main CSS file (e.g., `app/globals.css`), replace the old directives:

```css
/* v4 syntax - use @import instead of @tailwind */
@import "tailwindcss";
```

**Important**: Remove any `tailwind.config.js` or `tailwind.config.ts` files - they're no longer used in v4.

## Core Concepts

### Utility-First Approach

Build designs using pre-defined utility classes directly in markup:

```jsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Action
  </button>
</div>
```

### Mobile-First Responsive Design

All breakpoints apply styles from that size and up:

- **Default**: Mobile styles (unprefixed)
- **sm:**: 640px and up
- **md:**: 768px and up
- **lg:**: 1024px and up
- **xl:**: 1280px and up
- **2xl:**: 1536px and up

```jsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width on mobile, half on tablet, third on desktop */}
</div>
```

## Common Patterns

### Flexbox Layouts

```jsx
{/* Horizontal stack with spacing */}
<div className="flex gap-4 items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* Vertical stack */}
<div className="flex flex-col gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* Centered content */}
<div className="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>
```

### Grid Layouts

```jsx
{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

{/* Auto-fit grid with minimum size */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  <div>Item</div>
</div>
```

### Cards and Containers

```jsx
<div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
  <div className="md:flex">
    <div className="md:shrink-0">
      <img className="h-48 w-full object-cover md:h-full md:w-48" src="..." alt="..." />
    </div>
    <div className="p-8">
      <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
        Category
      </div>
      <h3 className="mt-1 text-lg font-medium text-black">Title</h3>
      <p className="mt-2 text-gray-500">Description text...</p>
    </div>
  </div>
</div>
```

## Dark Mode Implementation

See [references/dark-mode.md](references/dark-mode.md) for comprehensive dark mode guidance including setup, custom variants, and best practices.

**Quick Example**:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Content adapts to theme</h1>
</div>
```

## Responsive Design Patterns

See [references/responsive-design.md](references/responsive-design.md) for detailed responsive patterns, breakpoint strategies, and mobile-first principles.

**Common Responsive Pattern**:

```jsx
{/* Stack on mobile, side-by-side on desktop */}
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>
```

## New v4 Features

### Container Queries (Built-in)

No plugin needed - container queries are now native:

```jsx
<div className="@container">
  <div className="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    {/* Responds to container size, not viewport */}
  </div>
</div>
```

### 3D Transforms

```jsx
<div className="perspective-distant">
  <div className="rotate-x-12 rotate-z-6 transform-3d">
    3D transformed content
  </div>
</div>
```

### Enhanced Gradients

```jsx
{/* Linear gradient with angle */}
<div className="bg-linear-45 from-indigo-500 via-purple-500 to-pink-500">
  Angled gradient
</div>

{/* Radial gradient */}
<div className="bg-radial-[at_25%_25%] from-white to-zinc-900 to-75%">
  Radial gradient
</div>
```

## CSS-First Configuration (v4)

See [references/configuration.md](references/configuration.md) for complete configuration guidance.

**Basic theme customization in `globals.css`**:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #4f46e5;
  --color-brand-secondary: #7c3aed;
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-card: 12px;
}
```

## Common Utility Classes

See [references/utility-reference.md](references/utility-reference.md) for comprehensive utility class reference organized by category.

**Essential utilities quick reference**:

**Layout**: `flex`, `grid`, `block`, `inline-block`, `hidden`
**Spacing**: `p-4`, `m-4`, `gap-2`, `space-x-4`
**Sizing**: `w-full`, `h-screen`, `size-10`, `max-w-md`
**Colors**: `bg-blue-500`, `text-gray-900`, `border-red-300`
**Typography**: `text-xl`, `font-bold`, `leading-relaxed`
**Effects**: `shadow-md`, `rounded-lg`, `opacity-50`

## Best Practices

### Class Organization

Order classes logically for readability:

```jsx
// 1. Layout (display, position)
// 2. Box model (width, height, padding, margin)
// 3. Typography (font, text)
// 4. Visual (background, border, shadow)
// 5. Interactive (hover, focus, active)

<button className="
  flex items-center justify-center
  w-full px-4 py-2
  text-sm font-semibold
  bg-blue-500 rounded-lg shadow-md
  hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
">
  Button
</button>
```

### Component Extraction

For repeated patterns, use React components or create custom utilities in CSS:

```jsx
// Component approach (recommended)
function Button({ children, variant = 'primary' }) {
  const baseClasses = "px-4 py-2 rounded font-semibold transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300"
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

### Performance Considerations

- Tailwind v4 automatically scans and purges unused styles
- No configuration needed for content paths (auto-detection)
- Production builds are optimized automatically

## Troubleshooting

### Styles Not Applying

1. Check PostCSS configuration is correct
2. Verify `@import "tailwindcss"` is in your CSS file
3. Restart dev server after configuration changes
4. Check browser console for CSS errors

### IntelliSense Issues

Install the Tailwind CSS IntelliSense extension for VS Code:

```bash
# Extension ID
bradlc.vscode-tailwindcss
```

Update to prerelease version for v4 support if needed.

### Migration from v3

Use the official upgrade tool:

```bash
npx @tailwindcss/upgrade@next
```

This automatically handles most v4 migration tasks.

## Additional Resources

- **Dark Mode**: [references/dark-mode.md](references/dark-mode.md)
- **Responsive Design**: [references/responsive-design.md](references/responsive-design.md)
- **Configuration**: [references/configuration.md](references/configuration.md)
- **Utility Reference**: [references/utility-reference.md](references/utility-reference.md)
- **Component Patterns**: [references/component-patterns.md](references/component-patterns.md)

## Breaking Changes from v3

**Key differences**:
- No `tailwind.config.js` - use CSS-first configuration
- Use `@import "tailwindcss"` instead of `@tailwind` directives
- No `@apply` in arbitrary properties
- Some utility names changed (see references for full list)
- `size-*` replaces `w-* h-*` combination
- Default border color changed to `currentColor`
