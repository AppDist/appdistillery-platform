# Hydration Debugging Reference

Debugging SSR/hydration mismatches in React and Next.js applications.

## Contents

- Understanding hydration
- Common hydration errors
- Debugging techniques
- Fix patterns
- Prevention strategies

## Understanding Hydration

### What is Hydration?

Hydration is the process where React attaches event handlers and state to server-rendered HTML. The client-side React must produce the **exact same HTML** as the server.

```
Server: Renders HTML string → Browser receives HTML → User sees content
Client: React runs → Compares to DOM → Attaches interactivity

If HTML differs: HYDRATION MISMATCH ERROR
```

### Why Hydration Errors Matter

1. **User Experience**: Page may flash or re-render unexpectedly
2. **SEO Impact**: Search engines may index incorrect content
3. **Performance**: React may discard server HTML and re-render entirely
4. **Console Noise**: Development warnings create confusion

## Common Hydration Errors

### Error Messages

```
Warning: Text content did not match. Server: "X" Client: "Y"

Warning: Expected server HTML to contain a matching <div> in <div>

Hydration failed because the initial UI does not match what was rendered on the server

There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering
```

### Error Categories

| Category | Example | Cause |
|----------|---------|-------|
| Text content | Date formatting | Different locale/timezone |
| Missing element | `null` vs element | Conditional rendering |
| Extra element | Element vs `null` | Browser-only content |
| Attribute mismatch | class differences | Dynamic class names |
| Invalid nesting | `<p>` inside `<p>` | HTML validation |

## Debugging Techniques

### Step 1: Identify the Component

React 19+ provides better error messages:
```
Hydration failed because the server rendered HTML didn't match the client.

- <div>Server: Tue Jan 01 2025</div>
+ <div>Client: Wed Jan 01 2025</div>
```

For older versions, use React DevTools to find highlighted components.

### Step 2: Compare Server vs Client Output

```typescript
// Add debug logging
export default function Component({ data }) {
  const html = <div>Content: {data.value}</div>
  
  // Log what's being rendered
  if (typeof window === 'undefined') {
    console.log('[Server]', JSON.stringify(data))
  } else {
    console.log('[Client]', JSON.stringify(data))
  }
  
  return html
}
```

### Step 3: Check for Dynamic Values

Common culprits that differ between server and client:

```typescript
// ❌ Different on server vs client
new Date()                    // Different times
Date.now()                    // Different timestamps
Math.random()                 // Different random values
typeof window                 // 'undefined' vs 'object'
localStorage.getItem('key')   // null vs stored value
document.cookie               // Different cookies
navigator.userAgent           // Not available on server
window.innerWidth             // Not available on server
```

## Common Causes and Fixes

### 1. Date/Time Formatting

```typescript
// ❌ Causes mismatch: Different timezone
function TimeDisplay() {
  return <span>{new Date().toLocaleString()}</span>
}

// ✅ Fix 1: Use consistent formatting
function TimeDisplay({ timestamp }) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',  // Force consistent timezone
  }).format(new Date(timestamp))
  
  return <span>{formatted}</span>
}

// ✅ Fix 2: Client-only rendering
function TimeDisplay({ timestamp }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  if (!mounted) return <span>Loading...</span>
  return <span>{new Date(timestamp).toLocaleString()}</span>
}

// ✅ Fix 3: Suppress warning for known mismatch
function TimeDisplay({ timestamp }) {
  return (
    <span suppressHydrationWarning>
      {new Date(timestamp).toLocaleString()}
    </span>
  )
}
```

### 2. Browser APIs

```typescript
// ❌ Causes mismatch: localStorage not available on server
function Preferences() {
  const theme = localStorage.getItem('theme') || 'light'
  return <div className={theme}>Content</div>
}

// ✅ Fix: Client-only access
function Preferences() {
  const [theme, setTheme] = useState('light')
  
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setTheme(saved)
  }, [])
  
  return <div className={theme}>Content</div>
}

// ✅ Alternative: Safe browser API hook
function useSafeLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState(defaultValue)
  
  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (stored) setValue(JSON.parse(stored))
  }, [key])
  
  const setStoredValue = (newValue: T) => {
    setValue(newValue)
    localStorage.setItem(key, JSON.stringify(newValue))
  }
  
  return [value, setStoredValue] as const
}
```

### 3. Conditional Rendering

```typescript
// ❌ Causes mismatch: Different on server
function UserGreeting() {
  if (typeof window === 'undefined') {
    return <div>Server</div>  // Server renders this
  }
  return <div>Client</div>    // Client renders this
}

// ✅ Fix: Consistent initial render
function UserGreeting() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => setIsClient(true), [])
  
  return <div>{isClient ? 'Client' : 'Loading...'}</div>
}
```

### 4. Random Values

```typescript
// ❌ Causes mismatch: Different random values
function RandomQuote({ quotes }) {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  return <p>{quotes[randomIndex]}</p>
}

// ✅ Fix: Seed from props or compute on server
function RandomQuote({ quotes, seed }) {
  // Use seeded random or select on server
  const index = seed % quotes.length
  return <p>{quotes[index]}</p>
}
```

### 5. Extension Interference

```typescript
// Browser extensions (Grammarly, password managers) can modify DOM
// causing hydration errors. Fix with suppressHydrationWarning:

function TextInput() {
  return (
    <input 
      suppressHydrationWarning  // Extensions may add attributes
      type="text"
    />
  )
}
```

### 6. Invalid HTML Nesting

```typescript
// ❌ Invalid: <p> cannot contain <div>
function BadNesting() {
  return (
    <p>
      <div>Content</div>
    </p>
  )
}

// ✅ Fix: Use valid nesting
function GoodNesting() {
  return (
    <div>
      <p>Content</p>
    </div>
  )
}
```

## Fix Patterns

### Pattern 1: ClientOnly Component

```typescript
'use client'

import { useState, useEffect, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  return mounted ? <>{children}</> : <>{fallback}</>
}

// Usage
<ClientOnly fallback={<Skeleton />}>
  <BrowserOnlyComponent />
</ClientOnly>
```

### Pattern 2: Dynamic Import with No SSR

```typescript
import dynamic from 'next/dynamic'

const BrowserOnlyChart = dynamic(
  () => import('@/components/Chart'),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)
```

### Pattern 3: useHydrated Hook

```typescript
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return hydrated
}

// Usage
function Component() {
  const hydrated = useHydrated()
  
  if (!hydrated) {
    return <ServerPlaceholder />
  }
  
  return <ClientContent />
}
```

### Pattern 4: Suppress Known Mismatches

```typescript
// Only use when mismatch is expected and acceptable
<time 
  dateTime={date.toISOString()}
  suppressHydrationWarning
>
  {date.toLocaleDateString()}
</time>
```

## Prevention Strategies

### 1. Server-Side Consistency

```typescript
// Ensure server and client receive same data
export async function getServerSideProps() {
  const timestamp = Date.now()  // Fixed point in time
  
  return {
    props: {
      timestamp,  // Pass to client
      formattedDate: new Date(timestamp).toISOString(),
    }
  }
}
```

### 2. Environment Detection

```typescript
// Safe environment check
const isServer = typeof window === 'undefined'
const isClient = typeof window !== 'undefined'

// But don't use for conditional rendering!
// Instead, use useEffect for client-only logic
```

### 3. Hydration-Safe State

```typescript
// Initialize state consistently
function Component() {
  // ✅ Same initial value on server and client
  const [count, setCount] = useState(0)
  
  // ❌ Different initial value
  const [width, setWidth] = useState(window.innerWidth)  // Error on server!
  
  // ✅ Initialize after mount
  const [width, setWidth] = useState(0)
  useEffect(() => setWidth(window.innerWidth), [])
}
```

### 4. Testing for Hydration

```typescript
// In tests, verify no hydration errors
import { render } from '@testing-library/react'

test('no hydration mismatch', () => {
  const consoleSpy = vi.spyOn(console, 'error')
  
  render(<MyComponent />)
  
  expect(consoleSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('Hydration')
  )
})
```

## Debug Tools

### Hydration Error Overlay

```typescript
'use client'

import { useEffect, useState } from 'react'

export function HydrationDebugger({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<string[]>([])
  
  useEffect(() => {
    const original = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('Hydration') || message.includes('did not match')) {
        setErrors(prev => [...prev, message])
      }
      original.apply(console, args)
    }
    return () => { console.error = original }
  }, [])
  
  return (
    <>
      {children}
      {errors.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: '#ff4444',
          color: 'white',
          padding: 16,
          maxWidth: 400,
          zIndex: 9999,
        }}>
          <h4>Hydration Errors ({errors.length})</h4>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
    </>
  )
}
```

## Hydration Debugging Checklist

When facing hydration errors:

- [ ] Read the full error message (server vs client values)
- [ ] Identify which component is causing the error
- [ ] Check for dynamic values (dates, random, browser APIs)
- [ ] Look for conditional rendering based on environment
- [ ] Verify HTML nesting is valid
- [ ] Check for browser extension interference
- [ ] Add logging to compare server vs client data
- [ ] Consider if ClientOnly wrapper is appropriate
- [ ] Use suppressHydrationWarning only for known, acceptable mismatches

## Quick Reference

```typescript
// Client-only component
const NoSSR = dynamic(() => import('./Component'), { ssr: false })

// Suppress specific mismatch
<span suppressHydrationWarning>{clientValue}</span>

// Safe browser API access
const [value, setValue] = useState(defaultValue)
useEffect(() => setValue(window.someAPI), [])

// Consistent date formatting
new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(date)
```
