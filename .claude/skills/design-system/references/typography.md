# Typography Reference

Complete typography system including fonts, sizes, weights, and hierarchy.

## Table of Contents

- [Font Families](#font-families)
- [Font Sizes](#font-sizes)
- [Font Weights](#font-weights)
- [Letter Spacing](#letter-spacing)
- [Line Heights](#line-heights)
- [Typography Hierarchy](#typography-hierarchy)
- [Text Colors](#text-colors)
- [Text Utilities](#text-utilities)

## Font Families

### Token Structure

```css
:root {
  --font-sans: /* Primary UI font */;
  --font-mono: /* Code/technical font */;
  --font-serif: /* Optional serif font */;
}

@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

### Usage

```tsx
// Primary text (default)
<p className="font-sans">Interface text</p>

// Code/technical
<code className="font-mono">const x = 1</code>

// Special cases
<blockquote className="font-serif">Quote text</blockquote>
```

### Font Loading (Next.js)

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

## Font Sizes

### Size Scale

| Class | Size | Pixels | Use Case |
|-------|------|--------|----------|
| `text-xs` | 0.75rem | 12px | Captions, labels |
| `text-sm` | 0.875rem | 14px | Secondary text |
| `text-base` | 1rem | 16px | **Body text** |
| `text-lg` | 1.125rem | 18px | Lead text |
| `text-xl` | 1.25rem | 20px | Small headings |
| `text-2xl` | 1.5rem | 24px | Section headings |
| `text-3xl` | 1.875rem | 30px | Page titles |
| `text-4xl` | 2.25rem | 36px | Hero titles |
| `text-5xl` | 3rem | 48px | Display text |
| `text-6xl` | 3.75rem | 60px | Large display |

### Responsive Sizes

```tsx
// Scale typography with viewport
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

<p className="text-sm md:text-base">
  Responsive paragraph
</p>
```

## Font Weights

### Weight Scale

| Class | Weight | Use Case |
|-------|--------|----------|
| `font-thin` | 100 | Display (rare) |
| `font-light` | 300 | De-emphasized |
| `font-normal` | 400 | **Body text** |
| `font-medium` | 500 | Slightly emphasized |
| `font-semibold` | 600 | **Headings** |
| `font-bold` | 700 | Strong emphasis |
| `font-extrabold` | 800 | Heavy emphasis |
| `font-black` | 900 | Maximum (rare) |

### Common Combinations

```tsx
// Body text
<p className="font-normal">Regular paragraph</p>

// Emphasized text
<span className="font-medium">Important note</span>

// Headings
<h2 className="font-semibold">Section Title</h2>
<h1 className="font-bold">Page Title</h1>

// Labels
<label className="text-sm font-medium">Field Label</label>
```

## Letter Spacing

### Tracking Scale

| Class | Value | Use Case |
|-------|-------|----------|
| `tracking-tighter` | -0.05em | Large display text |
| `tracking-tight` | -0.025em | **Headings** |
| `tracking-normal` | 0em | Body text |
| `tracking-wide` | 0.025em | Uppercase labels |
| `tracking-wider` | 0.05em | Spaced uppercase |
| `tracking-widest` | 0.1em | Loose uppercase |

### Usage Patterns

```tsx
// Tight for large headings
<h1 className="text-4xl font-bold tracking-tight">
  Hero Title
</h1>

// Wide for uppercase labels
<span className="text-xs uppercase tracking-wide font-medium">
  Category
</span>

// Normal for body (default)
<p className="tracking-normal">Body text</p>
```

## Line Heights

### Leading Scale

| Class | Value | Use Case |
|-------|-------|----------|
| `leading-none` | 1 | Single-line headings |
| `leading-tight` | 1.25 | Headings, compact |
| `leading-snug` | 1.375 | Tight paragraphs |
| `leading-normal` | 1.5 | **Body text** |
| `leading-relaxed` | 1.625 | Comfortable reading |
| `leading-loose` | 2 | Very spacious |

### Usage

```tsx
// Tight for headings
<h2 className="text-2xl font-semibold leading-tight">
  Section Heading
</h2>

// Normal for body
<p className="leading-normal">Body paragraph</p>

// Relaxed for long-form
<article className="leading-relaxed">
  Long-form content
</article>
```

## Typography Hierarchy

### Heading System

```tsx
// Page title (H1)
<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
  Page Title
</h1>

// Section heading (H2)
<h2 className="text-2xl font-semibold tracking-tight">
  Section Title
</h2>

// Subsection (H3)
<h3 className="text-xl font-semibold">
  Subsection
</h3>

// Card/component title (H4)
<h4 className="text-lg font-semibold">
  Card Title
</h4>

// Small heading (H5)
<h5 className="text-base font-semibold">
  Small Heading
</h5>

// Tiny heading (H6)
<h6 className="text-sm font-semibold">
  Tiny Heading
</h6>
```

### Body Text Hierarchy

```tsx
// Lead paragraph
<p className="text-lg text-foreground leading-relaxed">
  Introduction paragraph with larger, more readable text
</p>

// Standard body
<p className="text-base text-foreground">
  Regular paragraph content
</p>

// Secondary text
<p className="text-sm text-muted-foreground">
  Supporting information
</p>

// Caption
<span className="text-xs text-muted-foreground">
  Image caption or metadata
</span>
```

### Code Typography

```tsx
// Inline code
<code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
  variable
</code>

// Code block
<pre className="font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
  <code>{codeContent}</code>
</pre>

// Technical IDs
<span className="font-mono text-sm text-muted-foreground">
  ID-001
</span>
```

## Text Colors

### Semantic Colors

```tsx
// Primary text
<p className="text-foreground">Main content</p>

// Secondary/muted text
<p className="text-muted-foreground">Supporting text</p>

// Accent colors
<span className="text-primary">Highlighted</span>
<span className="text-secondary">Secondary highlight</span>

// State colors
<span className="text-destructive">Error message</span>
```

### Color on Backgrounds

```tsx
// Always pair correctly
<div className="bg-primary text-primary-foreground">
  Text on primary background
</div>

<div className="bg-card text-card-foreground">
  Card content
</div>

<div className="bg-muted text-muted-foreground">
  Muted section
</div>
```

## Text Utilities

### Alignment

```tsx
<p className="text-left">Left aligned</p>
<p className="text-center">Centered</p>
<p className="text-right">Right aligned</p>
<p className="text-justify">Justified text</p>
```

### Transform

```tsx
<p className="uppercase">UPPERCASE</p>
<p className="lowercase">lowercase</p>
<p className="capitalize">Capitalized Words</p>
<p className="normal-case">Normal case</p>
```

### Decoration

```tsx
<p className="underline">Underlined</p>
<p className="line-through">Strikethrough</p>
<p className="no-underline">No underline</p>
```

### Overflow

```tsx
// Truncate single line
<p className="truncate">
  Very long text that gets cut off...
</p>

// Clamp multiple lines
<p className="line-clamp-3">
  Text limited to three lines with ellipsis...
</p>

// Break words
<p className="wrap-break-word">
  LongWordThatWouldOtherwiseOverflow
</p>

// Whitespace handling
<pre className="whitespace-pre">Preserves   spaces</pre>
<p className="whitespace-nowrap">No wrapping allowed</p>
```

## Typography Best Practices

### 1. Clear Hierarchy

```tsx
// ✅ GOOD - Clear hierarchy
<div>
  <h2 className="text-2xl font-semibold">Title</h2>
  <p className="text-base text-foreground">Body</p>
  <p className="text-sm text-muted-foreground">Meta</p>
</div>

// ❌ BAD - No hierarchy
<div>
  <div className="text-base">Title</div>
  <div className="text-base">Body</div>
  <div className="text-base">Meta</div>
</div>
```

### 2. Readable Line Length

```tsx
// ✅ GOOD - Constrained width
<article className="max-w-prose">
  <p>Long-form content...</p>
</article>

// ❌ BAD - Too wide
<p className="w-full">Very long line of text...</p>
```

### 3. Semantic HTML

```tsx
// ✅ GOOD - Semantic
<h1>Page Title</h1>
<p>Paragraph</p>
<strong>Important</strong>

// ❌ BAD - Div soup
<div className="text-4xl">Page Title</div>
<div>Paragraph</div>
<span className="font-bold">Important</span>
```

### 4. Responsive Typography

```tsx
// ✅ GOOD - Scales responsively
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

### 5. Uppercase Only for Labels

```tsx
// ✅ GOOD - Uppercase for small labels
<span className="text-xs uppercase tracking-wide font-medium">
  Label
</span>

// ❌ BAD - Uppercase body text
<p className="uppercase">Long paragraph in uppercase is hard to read</p>
```

### 6. Sufficient Contrast

```tsx
// ✅ GOOD - High contrast
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">

// ❌ BAD - Low contrast (check with tools)
<div className="bg-muted text-muted-foreground/50">
```

## Quick Reference

### Common Patterns

| Use Case | Classes |
|----------|---------|
| Page title | `text-3xl md:text-4xl font-bold tracking-tight` |
| Section heading | `text-2xl font-semibold` |
| Card title | `text-lg font-semibold` |
| Body text | `text-base text-foreground` |
| Secondary text | `text-sm text-muted-foreground` |
| Label | `text-sm font-medium` |
| Caption | `text-xs text-muted-foreground` |
| Uppercase label | `text-xs uppercase tracking-wide font-medium` |
| Code | `font-mono text-sm` |
| Error text | `text-sm text-destructive` |
