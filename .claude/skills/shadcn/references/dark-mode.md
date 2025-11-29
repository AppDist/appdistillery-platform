# Dark Mode Implementation

Complete guide to implementing dark mode in shadcn/ui projects with Next.js 15 and Tailwind CSS v4.

## Overview

shadcn/ui uses class-based dark mode with `next-themes` for theme management. Dark mode works by applying the `.dark` class to the root element, which triggers dark color variables.

## Setup Steps

### 1. Install next-themes

```bash
npm install next-themes
```

### 2. Create Theme Provider

Create `components/theme-provider.tsx`:

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 3. Wrap Application

Update `app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Important**: Include `suppressHydrationWarning` on `<html>` tag to prevent hydration mismatch.

### 4. Create Theme Toggle

Create `components/theme-toggle.tsx`:

```tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 5. Use Theme Toggle

```tsx
// app/page.tsx or any component
import { ThemeToggle } from "@/components/theme-toggle"

export default function Page() {
  return (
    <div>
      <nav>
        <ThemeToggle />
      </nav>
      {/* Rest of your content */}
    </div>
  )
}
```

## ThemeProvider Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `attribute` | string | `'class'` | HTML attribute for theme switching |
| `defaultTheme` | string | `'system'` | Initial theme |
| `enableSystem` | boolean | `false` | Enable system preference detection |
| `disableTransitionOnChange` | boolean | `false` | Disable CSS transitions when switching |
| `storageKey` | string | `'theme'` | localStorage key for theme |
| `themes` | string[] | `['light', 'dark']` | Available themes |

### Example Configurations

**Basic Setup**:
```tsx
<ThemeProvider attribute="class" defaultTheme="light">
  {children}
</ThemeProvider>
```

**With System Preference**:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
  {children}
</ThemeProvider>
```

**Multiple Themes**:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  themes={['light', 'dark', 'ocean', 'forest']}
>
  {children}
</ThemeProvider>
```

## Theme Toggle Variants

### Simple Toggle Button

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] dark:hidden" />
      <Moon className="hidden h-[1.2rem] w-[1.2rem] dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### Segmented Control

```tsx
"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function SegmentedThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex rounded-lg border border-input bg-background p-1">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="rounded-md"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light</span>
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="rounded-md"
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark</span>
      </Button>
      <Button
        variant={theme === "system" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className="rounded-md"
      >
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System</span>
      </Button>
    </div>
  )
}
```

### Switch Control

```tsx
"use client"

import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="dark-mode"
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Label htmlFor="dark-mode">Dark mode</Label>
    </div>
  )
}
```

## Using Theme in Components

### Accessing Current Theme

```tsx
"use client"

import { useTheme } from "next-themes"

export function ComponentWithTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      {/* resolvedTheme returns actual theme when theme="system" */}
    </div>
  )
}
```

### Conditional Rendering

```tsx
"use client"

import { useTheme } from "next-themes"

export function ThemeAwareComponent() {
  const { resolvedTheme } = useTheme()

  return (
    <div>
      {resolvedTheme === "dark" ? (
        <p>Dark mode content</p>
      ) : (
        <p>Light mode content</p>
      )}
    </div>
  )
}
```

### Theme-Specific Images

```tsx
"use client"

import { useTheme } from "next-themes"
import Image from "next/image"

export function ThemedLogo() {
  const { resolvedTheme } = useTheme()

  return (
    <Image
      src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Logo"
      width={200}
      height={50}
    />
  )
}
```

## Preventing Hydration Mismatch

### The Problem

When server-renders with one theme, but client immediately switches to another, you may see a flash or hydration error.

### Solution 1: suppressHydrationWarning

```tsx
<html lang="en" suppressHydrationWarning>
```

This is the recommended approach for Next.js 15.

### Solution 2: useEffect for Client-Only Rendering

```tsx
"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeAwareComponent() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // or skeleton
  }

  return <div>Theme: {theme}</div>
}
```

## Advanced: Custom Dark Mode Colors

### Fine-Tuning Dark Colors

Edit `app/globals.css`:

```css
.dark {
  /* Standard dark colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  
  /* Custom adjustments for better dark mode */
  --card: oklch(0.16 0 0);  /* Slightly lighter than background */
  --border: oklch(0.25 0 0);  /* More visible borders */
  
  /* Adjust accent colors for dark mode */
  --accent: oklch(0.35 0.05 240);
  --accent-foreground: oklch(0.95 0 0);
}
```

### Component-Specific Dark Mode

```css
@layer components {
  .custom-card {
    @apply bg-card text-card-foreground;
  }
  
  .dark .custom-card {
    @apply shadow-lg border-border/50;
  }
}
```

## System Preference Detection

### Listening to System Changes

```tsx
"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function SystemThemeListener() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      console.log("System theme changed to:", e.matches ? "dark" : "light")
      // Theme automatically updates, this is just for logging
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return null
}
```

### Initial System Preference

```tsx
"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function InitialSystemTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const hasTheme = localStorage.getItem("theme")
    if (!hasTheme) {
      // First visit - set to system preference
      setTheme("system")
    }
  }, [setTheme])

  return null
}
```

## Troubleshooting

### Theme not persisting

**Check**:
1. `storageKey` prop set correctly
2. localStorage not blocked by browser
3. Cookie consent not blocking localStorage

**Solution**:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  storageKey="my-app-theme"  // Custom key
>
  {children}
</ThemeProvider>
```

### Flash of wrong theme (FOUT)

**Check**:
1. `suppressHydrationWarning` on `<html>` tag
2. `disableTransitionOnChange` set to `true`

**Solution**:
```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider disableTransitionOnChange>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Colors not changing in dark mode

**Check**:
1. CSS variables defined in both `:root` and `.dark`
2. `@custom-variant dark` directive present
3. Components using CSS variables (not hardcoded colors)

**Solution**: Verify `app/globals.css` has complete dark mode definitions.

### Theme toggle not working

**Check**:
1. Component marked with `"use client"`
2. ThemeProvider wrapping application
3. `next-themes` installed

## Best Practices

1. **Always use suppressHydrationWarning**: Prevents hydration mismatch
2. **Enable system preference**: Better UX with `enableSystem`
3. **Disable transitions on change**: Smoother theme switching
4. **Test both themes**: Design components for both light and dark
5. **Use CSS variables**: Easier theme customization
6. **Provide visual feedback**: Show current theme in toggle
7. **Consider accessibility**: Ensure sufficient contrast in both modes
8. **Test on real devices**: System preference behavior varies
9. **Handle loading state**: Show skeleton while theme loads
10. **Document custom colors**: Keep track of theme modifications

## Testing Dark Mode

### Manual Testing Checklist

- [ ] Toggle between light/dark/system
- [ ] Verify colors in both modes
- [ ] Check contrast ratios (use browser DevTools)
- [ ] Test on different browsers
- [ ] Test system preference switching
- [ ] Verify localStorage persistence
- [ ] Check hydration (no flash/error)
- [ ] Test with JavaScript disabled
- [ ] Verify accessibility (screen readers)

### Automated Testing

```tsx
// __tests__/theme-toggle.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeProvider } from 'next-themes'

describe('ThemeToggle', () => {
  it('toggles between light and dark', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    // Add assertions
  })
})
```
