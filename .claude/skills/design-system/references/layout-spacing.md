# Layout & Spacing Reference

Guidelines for spacing, layout patterns, and responsive design.

## Table of Contents

- [Spacing System](#spacing-system)
- [Layout Patterns](#layout-patterns)
- [Grid Systems](#grid-systems)
- [Responsive Design](#responsive-design)
- [Vertical Rhythm](#vertical-rhythm)

## Spacing System

### Base Unit

All spacing based on 4px (0.25rem) unit:

```css
--spacing: 0.25rem; /* 4px */
```

### Spacing Scale

| Class | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `0` | 0 | 0px | No spacing |
| `1` | 0.25rem | 4px | Tight spacing, icons |
| `2` | 0.5rem | 8px | Small gaps |
| `3` | 0.75rem | 12px | Medium-small |
| `4` | 1rem | 16px | **Standard** |
| `5` | 1.25rem | 20px | Medium |
| `6` | 1.5rem | 24px | Large |
| `8` | 2rem | 32px | Section spacing |
| `10` | 2.5rem | 40px | Large sections |
| `12` | 3rem | 48px | Major sections |
| `16` | 4rem | 64px | Hero sections |
| `20` | 5rem | 80px | Maximum |

### Spacing Utilities

```tsx
// Padding
<div className="p-4">      {/* All sides: 16px */}
<div className="px-4">     {/* Left/Right: 16px */}
<div className="py-4">     {/* Top/Bottom: 16px */}
<div className="pt-4">     {/* Top only */}
<div className="pr-4">     {/* Right only */}
<div className="pb-4">     {/* Bottom only */}
<div className="pl-4">     {/* Left only */}

// Margin
<div className="m-4">      {/* All sides */}
<div className="mx-4">     {/* Horizontal */}
<div className="my-4">     {/* Vertical */}
<div className="mx-auto">  {/* Center horizontally */}

// Gap (Flexbox/Grid)
<div className="gap-4">    {/* All gaps */}
<div className="gap-x-4">  {/* Column gaps */}
<div className="gap-y-4">  {/* Row gaps */}

// Space Between (Stacks)
<div className="space-y-4"> {/* Vertical stack */}
<div className="space-x-4"> {/* Horizontal stack */}
```

### Consistent Spacing Guidelines

| Context | Recommended | Class |
|---------|-------------|-------|
| Button group gap | 8px | `gap-2` |
| Form field gap | 8px | `space-y-2` |
| Form section gap | 16px | `space-y-4` |
| Card internal padding | 16px | `p-4` |
| Card content gap | 12px | `space-y-3` |
| Section gap | 24px | `space-y-6` |
| Page section gap | 48px | `space-y-12` |

## Layout Patterns

### Page Shell

```tsx
<div className="min-h-screen bg-background text-foreground">
  {/* Fixed header */}
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <div className="container mx-auto px-4 h-16 flex items-center">
      {/* Header content */}
    </div>
  </header>
  
  {/* Main content */}
  <main className="container mx-auto px-4 py-8">
    {/* Page content */}
  </main>
  
  {/* Footer */}
  <footer className="border-t mt-auto">
    <div className="container mx-auto px-4 py-6">
      {/* Footer content */}
    </div>
  </footer>
</div>
```

### Sidebar + Main

```tsx
<div className="flex min-h-screen">
  {/* Sidebar - fixed width */}
  <aside className="w-64 border-r bg-muted/30 shrink-0">
    <div className="sticky top-0 p-4">
      {/* Sidebar content */}
    </div>
  </aside>
  
  {/* Main content - flexible */}
  <main className="flex-1 overflow-auto">
    <div className="container mx-auto p-4 md:p-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Two-Column Content

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Main content: 8 columns */}
    <div className="lg:col-span-8 space-y-6">
      {/* Primary content */}
    </div>
    
    {/* Sidebar: 4 columns */}
    <aside className="lg:col-span-4 space-y-6">
      {/* Secondary content */}
    </aside>
  </div>
</div>
```

### Centered Content

```tsx
{/* Max-width centered container */}
<div className="mx-auto max-w-2xl px-4 py-8">
  {/* Narrow content (672px max) */}
</div>

{/* Prose/reading width */}
<article className="mx-auto max-w-prose px-4 py-8">
  {/* Optimal reading width (~65ch) */}
</article>
```

### Stack Layout

```tsx
{/* Vertical stack with consistent spacing */}
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

{/* Horizontal stack */}
<div className="flex items-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Grid Systems

### Auto-Responsive Grid

```tsx
{/* Cards that wrap responsively */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id} className="rounded-2xl border bg-card p-4">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Dashboard Metrics Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="rounded-2xl border bg-card p-4">Metric 1</div>
  <div className="rounded-2xl border bg-card p-4">Metric 2</div>
  <div className="rounded-2xl border bg-card p-4">Metric 3</div>
  <div className="rounded-2xl border bg-card p-4">Metric 4</div>
</div>
```

### 12-Column Grid

```tsx
<div className="grid grid-cols-12 gap-4">
  {/* Full width */}
  <div className="col-span-12">Full</div>
  
  {/* Half width */}
  <div className="col-span-6">Half</div>
  <div className="col-span-6">Half</div>
  
  {/* Thirds */}
  <div className="col-span-4">Third</div>
  <div className="col-span-4">Third</div>
  <div className="col-span-4">Third</div>
  
  {/* 8/4 split */}
  <div className="col-span-8">Main</div>
  <div className="col-span-4">Sidebar</div>
</div>
```

### Responsive Grid Columns

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 
    Mobile: 1 column
    Tablet: 2 columns  
    Desktop: 3 columns 
  */}
</div>
```

## Responsive Design

### Breakpoints

| Prefix | Min Width | Device |
|--------|-----------|--------|
| (none) | 0px | Mobile |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile-First Approach

Always start with mobile styles, then add larger breakpoints:

```tsx
// ✅ CORRECT - Mobile first
<div className="p-4 md:p-6 lg:p-8">

// ❌ WRONG - Desktop first
<div className="p-8 md:p-6 sm:p-4">
```

### Responsive Patterns

```tsx
{/* Responsive spacing */}
<div className="p-4 md:p-6 lg:p-8">

{/* Responsive layout */}
<div className="flex flex-col lg:flex-row gap-4">

{/* Responsive visibility */}
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

{/* Responsive text */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">

{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Container Widths

```tsx
{/* Standard container (auto max-width) */}
<div className="container mx-auto px-4">

{/* Custom max widths */}
<div className="max-w-sm mx-auto">   {/* 384px */}
<div className="max-w-md mx-auto">   {/* 448px */}
<div className="max-w-lg mx-auto">   {/* 512px */}
<div className="max-w-xl mx-auto">   {/* 576px */}
<div className="max-w-2xl mx-auto">  {/* 672px */}
<div className="max-w-4xl mx-auto">  {/* 896px */}
<div className="max-w-6xl mx-auto">  {/* 1152px */}
<div className="max-w-full">          {/* No limit */}
```

## Vertical Rhythm

### Consistent Component Spacing

```tsx
{/* Tight: Within components */}
<div className="space-y-1">  {/* 4px - labels, small text */}
<div className="space-y-2">  {/* 8px - form fields */}

{/* Standard: Between components */}
<div className="space-y-3">  {/* 12px - card content */}
<div className="space-y-4">  {/* 16px - form sections */}

{/* Large: Between sections */}
<div className="space-y-6">  {/* 24px - page sections */}
<div className="space-y-8">  {/* 32px - major sections */}

{/* Extra large: Page level */}
<div className="space-y-12"> {/* 48px - hero/footer gaps */}
```

### Form Vertical Rhythm

```tsx
<form className="space-y-6">
  {/* Field group */}
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Field 1</Label>
      <Input />
    </div>
    <div className="space-y-2">
      <Label>Field 2</Label>
      <Input />
    </div>
  </div>
  
  {/* Actions (separated) */}
  <div className="pt-4 border-t flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </div>
</form>
```

### Card Vertical Rhythm

```tsx
<div className="rounded-2xl border bg-card p-4 space-y-3">
  {/* Title row */}
  <h3 className="font-semibold">Card Title</h3>
  
  {/* Content */}
  <div className="space-y-2">
    <p className="text-sm">Primary content</p>
    <p className="text-sm text-muted-foreground">Secondary content</p>
  </div>
  
  {/* Actions */}
  <div className="pt-3 border-t flex gap-2">
    <Button size="sm">Action</Button>
  </div>
</div>
```

## Common Layout Issues

### Preventing Layout Shift

```tsx
{/* Reserve space for loading content */}
<div className="min-h-[200px]">
  {isLoading ? <Skeleton /> : <Content />}
</div>

{/* Fixed aspect ratio */}
<div className="aspect-video">
  <img className="w-full h-full object-cover" />
</div>
```

### Overflow Handling

```tsx
{/* Scroll container */}
<div className="overflow-auto max-h-96">
  {/* Scrollable content */}
</div>

{/* Truncate text */}
<p className="truncate">Long text that will be cut off...</p>

{/* Line clamp */}
<p className="line-clamp-3">Text limited to 3 lines...</p>
```

### Sticky Elements

```tsx
{/* Sticky header */}
<header className="sticky top-0 z-50 bg-background">

{/* Sticky sidebar */}
<aside className="sticky top-16"> {/* Below header */}
```

## Best Practices

1. **Use consistent spacing scale** - Stick to 4, 8, 12, 16, 24, 32, 48px
2. **Prefer gap over margin** - Cleaner with Flexbox/Grid
3. **Use space-y for stacks** - Simpler than individual margins
4. **Mobile-first responsive** - Start small, scale up
5. **Maintain vertical rhythm** - Consistent spacing creates harmony
6. **Group related elements** - Smaller spacing within, larger between
7. **Test all breakpoints** - Verify layout at each screen size
8. **Use container for max-width** - Prevent content stretching
9. **Align to 4px grid** - All spacing multiples of 4px
