---
name: shadcn
description: Build accessible UI components with shadcn/ui, Tailwind CSS v4, and Next.js 15. Use when creating or managing shadcn/ui components, setting up projects with Tailwind v4, working with component theming, or configuring shadcn/ui in Next.js applications. Supports component installation, customization, dark mode, and Tailwind v4 CSS variables. (project)
---

# shadcn/ui Component Development

Build production-ready UI components using shadcn/ui with Tailwind CSS v4 and Next.js 15.5.6+. This skill provides guidance for component setup, theming, customization, and best practices.

## Quick Start

### New Project Setup

1. Create Next.js project with Tailwind:
```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app
```

2. Initialize shadcn/ui:
```bash
npx shadcn@latest init
```

Follow prompts to configure:
- Style: `new-york` (recommended) or `default`
- Base color: `neutral`, `slate`, `zinc`, etc.
- CSS variables: `yes` (recommended for Tailwind v4)

3. Add components:
```bash
npx shadcn@latest add button card input
```

## Core Concepts

### Component Philosophy

shadcn/ui components are **not a traditional library** - you own the code:
- Components are copied directly into your project
- Full customization control
- No version lock-in
- Built on Radix UI primitives for accessibility

### Tailwind v4 Integration

**Key Changes from v3**:
- CSS-first configuration (no `tailwind.config.js` required)
- Use `@theme inline` for CSS variable mapping
- Color variables wrapped in `oklch()` or `hsl()`
- Plugin system uses `@plugin` directive

## Project Structure

```
your-project/
├── app/
│   ├── globals.css          # Tailwind imports + theme variables
│   └── layout.tsx            # Root layout with providers
├── components/
│   ├── ui/                   # shadcn/ui components (auto-generated)
│   └── [your-components]/    # Your custom components
├── lib/
│   └── utils.ts              # cn() helper for class merging
├── components.json           # shadcn/ui configuration
└── package.json
```

## Configuration

### components.json

Critical configuration file - defines how components are installed:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
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

**Key Fields**:
- `style`: Component visual style (cannot change after init)
- `tailwind.css`: Path to global CSS file with theme variables
- `tailwind.cssVariables`: Use CSS variables (recommended for v4)
- `aliases`: Import path configurations

### globals.css Setup

For detailed CSS variable configuration and theme setup, see [references/css-variables.md](references/css-variables.md).

## Component Usage

### Installing Components

```bash
# Single component
npx shadcn@latest add button

# Multiple components
npx shadcn@latest add button card dialog form

# All components
npx shadcn@latest add
```

### Using Components

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Component Variants

Most components support multiple variants:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

## Customization

### Modifying Components

Components live in `components/ui/` - edit them directly:

```tsx
// components/ui/button.tsx
// Add new variant
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        // ... existing variants
        brand: "bg-brand text-brand-foreground hover:bg-brand/90",
      },
    },
  }
)
```

### Adding Custom Colors

See [references/theming.md](references/theming.md) for complete theming guide.

## Dark Mode

### Setup with next-themes

1. Install dependency:
```bash
npm install next-themes
```

2. Create theme provider:
```tsx
// components/theme-provider.tsx
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

3. Wrap app in provider:
```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

4. Create theme toggle component - see [references/dark-mode.md](references/dark-mode.md)

## Forms with React Hook Form

### Installation

```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest add form
```

### Usage

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Common Patterns

### Composition Pattern

Build complex UIs by composing simpler components:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Login</Button>
      </CardFooter>
    </Card>
  )
}
```

### Dialog Pattern

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Make changes to your account here.
          </DialogDescription>
        </DialogHeader>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  )
}
```

## Troubleshooting

### Common Issues

**Component not found after installation**:
- Check `components.json` aliases match your project structure
- Verify import paths use configured aliases
- Run `npx shadcn@latest add [component]` again

**Styling conflicts**:
- Use `cn()` utility to merge classes safely
- Check Tailwind v4 configuration in `globals.css`
- Verify CSS variables are properly defined

**TypeScript errors**:
- Ensure `tsx: true` in `components.json`
- Check `tsconfig.json` has correct path mappings
- Update `@types/react` and `@types/react-dom` to latest

**Dark mode not working**:
- Verify `suppressHydrationWarning` on `<html>` tag
- Check theme provider configuration
- Ensure dark mode CSS variables are defined

### Tailwind v4 Specific Issues

**Installation fails**:
- For Tailwind v4, leave `tailwind.config` empty in `components.json`
- Use `@theme inline` in CSS file instead of config file

**Color variables not working**:
- Wrap color values in `oklch()` or `hsl()` in CSS
- Use `--color-*` prefix in `@theme inline` mapping
- Check CSS variable definitions match theme structure

## Best Practices

1. **Use CSS Variables**: Enable `cssVariables: true` for easier theming
2. **Leverage cn() utility**: Always merge classes with `cn()` helper
3. **Compose components**: Build complex UIs from simple building blocks
4. **Type everything**: Use TypeScript for better DX and fewer errors
5. **Follow naming conventions**: Keep component names consistent
6. **Customize locally**: Edit components directly - you own the code
7. **Test accessibility**: Components are built on Radix for a11y, but test your usage
8. **Use server components**: Leverage Next.js 15 App Router features

## References

- [CSS Variables & Theming](references/css-variables.md) - Complete CSS setup guide
- [Theming Guide](references/theming.md) - Custom colors and themes
- [Dark Mode Setup](references/dark-mode.md) - Comprehensive dark mode implementation
- [Component List](references/components.md) - Available components and usage
- [Tailwind v4 Migration](references/tailwind-v4-migration.md) - Upgrading from v3 to v4

## Dependencies

Required packages (auto-installed with components):
- `@radix-ui/*` - Primitive components
- `class-variance-authority` - Variant management
- `clsx` - Conditional classes
- `tailwind-merge` - Class deduplication
- `lucide-react` - Icons (if using default icon library)
- `next-themes` - Theme management (for dark mode)
- `react-hook-form` - Form handling (for form components)
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation

Tailwind CSS v4 specific:
- `tailwindcss@latest` - Tailwind CSS v4
- `@tailwindcss/postcss` - PostCSS plugin (for Next.js)
- `@tailwindcss/vite` - Vite plugin (for Vite projects)
- `tw-animate-css` - Animations (replaces tailwindcss-animate)
