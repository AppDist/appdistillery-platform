# Dark Mode Implementation

Comprehensive guide to implementing dark mode with Tailwind CSS v4.

## Quick Start

### Basic Dark Mode

Apply dark mode styles using the `dark:` variant:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-2xl font-bold">Adapts to theme</h1>
  <p className="text-gray-600 dark:text-gray-400">Secondary text</p>
</div>
```

### System Preference (Default)

By default, Tailwind uses the system's color scheme preference:

```css
/* This is automatic - no configuration needed */
@media (prefers-color-scheme: dark) {
  .dark\:bg-gray-900 {
    background-color: rgb(17 24 39);
  }
}
```

## Manual Dark Mode Toggle

### Class-Based Toggle

Use a `dark` class on the `<html>` element for manual control.

**Step 1**: Configure the dark variant in your CSS:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Step 2**: Add toggle logic with JavaScript:

```javascript
// Check localStorage and system preference on page load
if (localStorage.theme === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Toggle functions
function setLightMode() {
  localStorage.theme = 'light';
  document.documentElement.classList.remove('dark');
}

function setDarkMode() {
  localStorage.theme = 'dark';
  document.documentElement.classList.add('dark');
}

function setSystemMode() {
  localStorage.removeItem('theme');
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
```

**Step 3**: Create a toggle component:

```jsx
'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(localStorage.theme || 'system');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme('light');
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Data Attribute Toggle

Alternative approach using `data-theme`:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

```jsx
// HTML structure
<html data-theme="dark">
  <body>
    <div className="bg-white dark:bg-black">
      Content
    </div>
  </body>
</html>
```

## Dark Mode Color Strategies

### Approach 1: Direct Color Pairs

Explicitly define both light and dark colors:

```jsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">Heading</h1>
  <p className="text-gray-600 dark:text-gray-400">Body text</p>
  <button className="bg-blue-500 dark:bg-blue-600 text-white">
    Button
  </button>
</div>
```

**Pros**: Explicit, easy to understand
**Cons**: More verbose, harder to maintain

### Approach 2: CSS Variables

Define semantic color variables in your theme:

```css
@import "tailwindcss";

@theme {
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-accent: #8b5cf6;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #1a1a1a;
    --color-foreground: #ffffff;
    --color-primary: #60a5fa;
    --color-secondary: #9ca3af;
    --color-accent: #a78bfa;
  }
}
```

Usage:

```jsx
<div className="bg-background text-foreground">
  <h1 className="text-2xl font-bold">Uses semantic colors</h1>
  <button className="bg-primary text-white">Primary Action</button>
</div>
```

**Pros**: Maintainable, semantic, less verbose
**Cons**: Requires setup, less explicit

### Approach 3: Opacity Modifiers

Use opacity to create dark mode variations:

```jsx
<div className="bg-gray-900">
  {/* Light text with different opacities */}
  <h1 className="text-white">Primary heading (100% opacity)</h1>
  <p className="text-white/80">Secondary text (80% opacity)</p>
  <span className="text-white/60">Tertiary text (60% opacity)</span>
</div>
```

## Dark Mode Best Practices

### 1. Consistent Contrast Ratios

Maintain WCAG AA contrast ratios in both modes:

```jsx
{/* Good contrast in both modes */}
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-100">High contrast</h1>
  <p className="text-gray-700 dark:text-gray-300">Body text</p>
  <span className="text-gray-500 dark:text-gray-400">Muted text</span>
</div>
```

### 2. Test in Both Modes

Always test components in both light and dark modes:

```jsx
{/* Bad - hard to read in dark mode */}
<div className="bg-gray-100">
  <span className="text-gray-300">Low contrast!</span>
</div>

{/* Good - readable in both modes */}
<div className="bg-gray-100 dark:bg-gray-800">
  <span className="text-gray-800 dark:text-gray-200">Good contrast</span>
</div>
```

### 3. Consider Images and Icons

Some images need dark mode variants:

```jsx
<div className="relative">
  {/* Light mode image */}
  <img 
    src="/logo-light.svg" 
    alt="Logo"
    className="dark:hidden"
  />
  {/* Dark mode image */}
  <img 
    src="/logo-dark.svg" 
    alt="Logo"
    className="hidden dark:block"
  />
</div>
```

### 4. Transition Between Modes

Add smooth transitions for theme changes:

```jsx
<div className="bg-white dark:bg-gray-900 transition-colors duration-200">
  <h1 className="text-gray-900 dark:text-white transition-colors duration-200">
    Smooth transition
  </h1>
</div>
```

### 5. Border Colors

Remember v4 changed default border color to `currentColor`:

```jsx
{/* Explicit border colors for both modes */}
<div className="border border-gray-300 dark:border-gray-700">
  Content with consistent borders
</div>
```

## Color Schemes

Use the `color-scheme` property for native form controls:

```jsx
<html className="scheme-light dark:scheme-dark">
  {/* Native controls adapt to color scheme */}
  <input type="text" />
  <select>
    <option>Option</option>
  </select>
</html>
```

## Common Dark Mode Patterns

### Card Component

```jsx
<div className="rounded-lg shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
    Card Title
  </h2>
  <p className="text-gray-600 dark:text-gray-300">
    Card content that adapts to theme
  </p>
</div>
```

### Navigation Bar

```jsx
<nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
  <div className="flex items-center justify-between px-6 py-4">
    <div className="text-xl font-bold text-gray-900 dark:text-white">
      Logo
    </div>
    <div className="flex gap-4">
      <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
        Link
      </a>
    </div>
  </div>
</nav>
```

### Button Variants

```jsx
{/* Primary button */}
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg">
  Primary
</button>

{/* Secondary button */}
<button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
  Secondary
</button>

{/* Outline button */}
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
  Outline
</button>
```

### Form Inputs

```jsx
<input 
  type="text"
  className="w-full px-4 py-2 
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    rounded-lg
    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600
    focus:border-transparent"
  placeholder="Enter text..."
/>
```

## Debugging Dark Mode

### Check System Preference

```javascript
// Check if system prefers dark mode
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('System prefers dark mode:', prefersDark);
```

### Inspect Applied Classes

```javascript
// Check if dark class is applied
const hasDarkClass = document.documentElement.classList.contains('dark');
console.log('Dark mode active:', hasDarkClass);
```

### Force Dark Mode (Testing)

```javascript
// Temporarily force dark mode
document.documentElement.classList.add('dark');
```

## Anti-Patterns to Avoid

### ❌ Forgetting Dark Mode Variants

```jsx
{/* Bad - light background only */}
<div className="bg-gray-100">
  <p className="text-gray-900">Unreadable in dark mode!</p>
</div>
```

### ❌ Inconsistent Color Application

```jsx
{/* Bad - mixing approaches */}
<div className="bg-background">
  <p className="text-gray-900">Mixed color systems</p>
</div>
```

### ❌ Hardcoded Colors in Styles

```jsx
{/* Bad - can't be themed */}
<div style={{ backgroundColor: '#ffffff' }}>
  Non-themeable
</div>

{/* Good - use Tailwind classes */}
<div className="bg-white dark:bg-gray-900">
  Themeable
</div>
```

## Next.js Specific Considerations

### Prevent Flash of Unstyled Content (FOUC)

Add script to `app/layout.tsx` before React hydrates:

```jsx
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const activeTheme = theme || systemTheme;
                
                if (activeTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Use next-themes Package

For more robust dark mode in Next.js:

```bash
npm install next-themes
```

```jsx
// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

```jsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```
