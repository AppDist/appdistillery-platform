# Responsive Design with Tailwind CSS

Comprehensive guide to building responsive UIs with Tailwind CSS v4's mobile-first approach.

## Core Principles

### Mobile-First Strategy

Tailwind uses a mobile-first breakpoint system. Styles without prefixes apply to all screen sizes, while breakpoint prefixes apply from that size upward.

```jsx
{/* Mobile: red, Tablet (md): green, Desktop (lg): blue */}
<div className="bg-red-500 md:bg-green-500 lg:bg-blue-500">
  Responsive background
</div>
```

### Breakpoint Reference

| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| (none) | 0px | Mobile (all sizes) |
| `sm:` | 640px | Large mobile |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large desktop |

### Viewport Meta Tag

Always include in your HTML `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Next.js includes this by default.

## Common Responsive Patterns

### 1. Responsive Columns

Stack on mobile, side-by-side on larger screens:

```jsx
{/* Full width on mobile, 2 columns on tablet, 3 on desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### 2. Responsive Flexbox

```jsx
{/* Stack vertically on mobile, horizontal on tablet+ */}
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>
```

### 3. Responsive Visibility

Show/hide elements at different breakpoints:

```jsx
{/* Show only on mobile */}
<div className="block md:hidden">
  Mobile menu
</div>

{/* Hide on mobile, show on tablet+ */}
<div className="hidden md:block">
  Desktop navigation
</div>

{/* Show on tablet only */}
<div className="hidden md:block lg:hidden">
  Tablet-specific content
</div>
```

### 4. Responsive Sizing

```jsx
{/* Small on mobile, larger on desktop */}
<img 
  className="w-16 md:w-32 lg:w-48" 
  src="/image.jpg" 
  alt="Responsive image"
/>
```

### 5. Responsive Spacing

```jsx
{/* Tighter spacing on mobile, more generous on desktop */}
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-4xl">
    Responsive heading
  </h1>
</div>
```

### 6. Responsive Typography

```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Scales with screen size
</h1>

<p className="text-sm md:text-base lg:text-lg leading-relaxed">
  Body text that adjusts
</p>
```

## Layout Patterns

### Sidebar Layout

Desktop sidebar, mobile stack:

```jsx
<div className="flex flex-col md:flex-row min-h-screen">
  {/* Sidebar */}
  <aside className="w-full md:w-64 bg-gray-100 p-4">
    <nav>Navigation</nav>
  </aside>
  
  {/* Main content */}
  <main className="flex-1 p-4 md:p-8">
    <h1 className="text-2xl font-bold">Content</h1>
  </main>
</div>
```

### Header with Collapsible Menu

```jsx
<header className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="text-xl font-bold">Logo</div>
      
      {/* Desktop menu */}
      <nav className="hidden md:flex gap-6">
        <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
        <a href="#" className="text-gray-700 hover:text-gray-900">About</a>
        <a href="#" className="text-gray-700 hover:text-gray-900">Contact</a>
      </nav>
      
      {/* Mobile menu button */}
      <button className="md:hidden">
        ☰
      </button>
    </div>
  </div>
</header>
```

### Responsive Card Grid

```jsx
{/* 1 column mobile, 2 tablet, 3 desktop, 4 xl */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {[...Array(8)].map((_, i) => (
    <div key={i} className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold">Card {i + 1}</h3>
      <p className="text-gray-600 mt-2">Card content</p>
    </div>
  ))}
</div>
```

### Hero Section

```jsx
<section className="min-h-screen flex items-center">
  <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* Text content */}
      <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          Hero Heading
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Supporting text that scales responsively
        </p>
        <button className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 text-white rounded-lg text-lg">
          Call to Action
        </button>
      </div>
      
      {/* Image */}
      <div className="order-first lg:order-last">
        <img 
          src="/hero.jpg" 
          alt="Hero" 
          className="w-full rounded-lg shadow-xl"
        />
      </div>
    </div>
  </div>
</section>
```

## Container Queries (v4)

New in v4: Style based on container size, not viewport:

```jsx
<div className="@container">
  {/* Responds to container width, not viewport */}
  <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </div>
</div>
```

### Container Query Variants

```jsx
{/* Container query breakpoints */}
<div className="@container">
  <div className="text-sm @md:text-base @lg:text-lg">
    Scales with container
  </div>
</div>
```

### Max-Width Container Queries

```jsx
<div className="@container">
  <div className="grid grid-cols-3 @max-md:grid-cols-1">
    {/* 3 columns normally, 1 when container is small */}
  </div>
</div>
```

## Arbitrary Breakpoints

For one-off custom breakpoints:

```jsx
{/* Custom min-width */}
<div className="min-[900px]:flex">
  Flex at 900px and up
</div>

{/* Custom max-width */}
<div className="max-[600px]:hidden">
  Hidden below 600px
</div>
```

## Best Practices

### 1. Design Mobile-First

Start with mobile styles, then enhance for larger screens:

```jsx
{/* ✅ Good: Mobile-first */}
<div className="text-sm md:text-base lg:text-lg">
  Scales up from mobile
</div>

{/* ❌ Bad: Desktop-first (harder to maintain) */}
<div className="text-lg md:text-base sm:text-sm">
  Scales down (confusing)
</div>
```

### 2. Use Logical Breakpoint Progression

```jsx
{/* ✅ Good: Logical progression */}
<div className="w-full sm:w-1/2 lg:w-1/3">
  Clear progression
</div>

{/* ❌ Bad: Skipping breakpoints creates gaps */}
<div className="w-full xl:w-1/3">
  What about md and lg?
</div>
```

### 3. Consistent Spacing Scale

Use the same spacing scale across breakpoints:

```jsx
{/* ✅ Good: Consistent scale */}
<div className="p-4 md:p-6 lg:p-8">
  Scales logically
</div>

{/* ❌ Bad: Inconsistent jumps */}
<div className="p-2 md:p-20 lg:p-4">
  Confusing spacing
</div>
```

### 4. Test All Breakpoints

Test your designs at each breakpoint:
- 375px (mobile)
- 768px (tablet)
- 1024px (small desktop)
- 1440px (large desktop)

### 5. Consider Content Density

Adjust information density for screen size:

```jsx
{/* Mobile: Essential info only */}
<div className="flex flex-col gap-2 md:gap-4">
  <h2 className="text-lg md:text-xl">Title</h2>
  {/* Show more details on larger screens */}
  <p className="hidden md:block text-gray-600">
    Additional description
  </p>
</div>
```

## Common Responsive Components

### Navigation Menu

```jsx
'use client';
import { useState } from 'react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold">Logo</span>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">About</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">Services</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">Contact</a>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-2 space-y-2">
            <a href="#" className="block py-2 text-gray-700">Home</a>
            <a href="#" className="block py-2 text-gray-700">About</a>
            <a href="#" className="block py-2 text-gray-700">Services</a>
            <a href="#" className="block py-2 text-gray-700">Contact</a>
          </div>
        </div>
      )}
    </nav>
  );
}
```

### Responsive Image

```jsx
<picture>
  <source 
    media="(min-width: 1024px)" 
    srcSet="/image-large.jpg"
  />
  <source 
    media="(min-width: 768px)" 
    srcSet="/image-medium.jpg"
  />
  <img 
    src="/image-small.jpg" 
    alt="Responsive"
    className="w-full h-auto"
  />
</picture>
```

### Responsive Table

```jsx
{/* Scrollable on mobile, normal on desktop */}
<div className="overflow-x-auto md:overflow-visible">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Email
        </th>
        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Phone
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

## Performance Considerations

### 1. Avoid Excessive Breakpoint Variants

```jsx
{/* ❌ Bad: Too many variants */}
<div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">
  Overkill
</div>

{/* ✅ Good: Strategic breakpoints */}
<div className="text-sm md:text-base lg:text-lg">
  Sufficient
</div>
```

### 2. Use Container Queries for Components

For reusable components, container queries are often better:

```jsx
{/* Component adapts to its container, not viewport */}
<div className="@container">
  <div className="p-2 @md:p-4 @lg:p-6">
    Adapts to container
  </div>
</div>
```

### 3. Optimize Images

Use Next.js Image component for automatic optimization:

```jsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Optimized"
  width={800}
  height={600}
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
/>
```

## Debugging Responsive Designs

### Chrome DevTools

1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test different device sizes
4. Use responsive mode with custom dimensions

### Responsive Design Mode in Firefox

1. Open Developer Tools (F12)
2. Click responsive design mode (Ctrl+Shift+M)
3. Test various screen sizes

### Tailwind Debug Classes

Temporarily add debug indicators:

```jsx
<div className="
  before:content-['mobile'] before:text-red-500 before:font-bold
  sm:before:content-['sm']
  md:before:content-['md']
  lg:before:content-['lg']
  xl:before:content-['xl']
  2xl:before:content-['2xl']
">
  Shows current breakpoint
</div>
```

## Common Pitfalls

### 1. Forgetting Mobile Styles

```jsx
{/* ❌ Bad: No mobile style */}
<div className="md:flex">
  {/* What about mobile? */}
</div>

{/* ✅ Good: Mobile-first */}
<div className="flex flex-col md:flex-row">
  Clear on all sizes
</div>
```

### 2. Inconsistent Gaps Between Breakpoints

```jsx
{/* ❌ Bad: Inconsistent behavior between sm and md */}
<div className="w-full sm:w-1/2 lg:w-1/3">
  {/* What happens at md? */}
</div>

{/* ✅ Good: Explicit at each relevant breakpoint */}
<div className="w-full sm:w-1/2 md:w-1/2 lg:w-1/3">
  Clear at all sizes
</div>
```

### 3. Over-Complicating Responsive Logic

```jsx
{/* ❌ Bad: Too complex */}
<div className="block sm:hidden md:block lg:hidden xl:block">
  Hard to maintain
</div>

{/* ✅ Good: Simple and clear */}
<div className="hidden lg:block">
  Show on large screens only
</div>
```
