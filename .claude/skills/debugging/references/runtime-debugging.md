# Runtime Debugging Reference

Debugging runtime errors, exceptions, and unexpected behavior.

## Contents

- Error analysis framework
- Stack trace interpretation
- Common runtime errors by category
- Debugging tools and techniques
- Error boundary patterns
- Production error tracking

## Error Analysis Framework

### Step 1: Parse the Error Message

```
Error: [Type]: [Message]
    at [Function] ([File]:[Line]:[Column])
    at [Function] ([File]:[Line]:[Column])
    ...
```

**Extract:**
1. **Error Type** - What class of error? (TypeError, ReferenceError, custom)
2. **Message** - What specifically failed?
3. **Location** - Where in your code did it originate?
4. **Call Stack** - What path led to this error?

### Step 2: Categorize the Error

| Error Type | Common Causes | First Check |
|------------|--------------|-------------|
| TypeError | Null/undefined access, wrong argument type | Variable initialization, prop passing |
| ReferenceError | Undefined variable, import issue | Import statements, scope |
| SyntaxError | Invalid code structure | Recent edits, copy-paste errors |
| RangeError | Array bounds, recursion depth | Loop conditions, recursive calls |
| Custom Error | Application logic failure | Business logic, validation |

### Step 3: Locate the Root Cause

The top of the stack trace shows where the error was thrown.
The bottom shows where execution started.
The root cause is often **between** these points.

```typescript
// Error thrown here ← symptom
function processData(data) {
  return data.items.map(/* ... */)  // TypeError: Cannot read 'map' of undefined
}

// Root cause is here ← actual bug
function fetchData() {
  return { items: undefined }  // Should return { items: [] }
}
```

## Common Runtime Errors

### Null/Undefined Access

**Symptom:**
```
TypeError: Cannot read property 'X' of undefined
TypeError: Cannot read property 'X' of null
```

**Debugging:**
```typescript
// Add defensive check to find where value becomes undefined
function debugNullChain(value: unknown, path: string) {
  if (value === null || value === undefined) {
    console.error(`[NULL_DEBUG] ${path} is ${value}`)
    console.trace()
  }
  return value
}

// Usage
const result = debugNullChain(data, 'data')
  ?.items  // Check each level
```

**Common causes:**
- Async data not yet loaded
- Optional chaining needed
- Array methods on non-arrays
- Object destructuring of undefined

### Async/Promise Errors

**Symptom:**
```
Unhandled Promise Rejection
Error: [message] (no stack trace)
```

**Debugging:**
```typescript
// Always handle promise errors explicitly
async function safeAsync<T>(
  promise: Promise<T>,
  context: string
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    console.error(`[${context}] Async error:`, error)
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

// Usage
const [data, error] = await safeAsync(fetchProposals(), 'fetchProposals')
if (error) {
  // Handle error with full context
}
```

### Import/Module Errors

**Symptom:**
```
Module not found: Can't resolve 'X'
SyntaxError: Cannot use import statement outside a module
```

**Debugging checklist:**
1. Check file exists at import path
2. Verify file extension (`.ts` vs `.tsx` vs `.js`)
3. Check `tsconfig.json` path mappings
4. Verify package is installed: `pnpm why <package>`
5. Clear module cache: `rm -rf node_modules/.cache`

### React-Specific Runtime Errors

**Invalid Hook Call:**
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Causes:**
- Hook called in class component
- Hook called conditionally
- Hook called in regular function
- Multiple React versions

**Debugging:**
```bash
# Check for duplicate React
pnpm why react
npm ls react
```

**Too Many Re-renders:**
```
Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
```

**Causes:**
- State update in render body
- Missing dependency array in useEffect
- Object/array in dependency array creating new reference each render

## Debugging Tools

### Browser DevTools

**Console Tab:**
- Filter by error level
- Preserve logs across navigation
- Group repeated messages

**Sources Tab:**
- Set breakpoints on exceptions
- Conditional breakpoints: `x === undefined`
- Logpoints: Log without modifying code

### Node.js Debugging

```bash
# Start with inspector
node --inspect-brk dist/server.js

# Or with pnpm
pnpm dev --inspect

# Connect: chrome://inspect
```

### Breakpoint Strategies

**Strategic breakpoints:**
1. Entry point of failing function
2. Just before error location
3. At data transformation points
4. At async boundaries

**Conditional breakpoints** (right-click breakpoint in VSCode):
```javascript
// Break only when condition is true
user.role === 'admin' && items.length === 0
```

## Error Boundary Patterns

### Basic Error Boundary

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <h2>Something went wrong</h2>
          {process.env.NODE_ENV === 'development' && (
            <pre>{this.state.error?.message}</pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
```

### Granular Error Boundaries

```typescript
// Wrap each major section
<ErrorBoundary fallback={<HeaderFallback />}>
  <Header />
</ErrorBoundary>

<ErrorBoundary fallback={<MainFallback />}>
  <MainContent />
</ErrorBoundary>

<ErrorBoundary fallback={<SidebarFallback />}>
  <Sidebar />
</ErrorBoundary>
```

## Production Error Tracking

### Minimal Error Reporter

```typescript
interface ErrorReport {
  message: string
  stack?: string
  context: Record<string, unknown>
  timestamp: string
  url: string
  userAgent: string
}

async function reportError(error: Error, context: Record<string, unknown> = {}) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
  }

  // Log locally in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', report)
    return
  }

  // Send to error tracking service in production
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
  } catch (e) {
    // Silently fail - don't cause more errors
    console.error('Failed to report error:', e)
  }
}
```

### Global Error Handlers

```typescript
// Browser global handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportError(event.error, { type: 'uncaught' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(
      event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason)),
      { type: 'unhandledRejection' }
    )
  })
}

// Node.js global handler
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[WARN] Unhandled rejection:', reason)
})
```

## Debugging Checklist

When facing a runtime error:

- [ ] Read the complete error message
- [ ] Identify the error type and category
- [ ] Trace the stack to find originating code
- [ ] Check recent changes in that area (`git diff`)
- [ ] Add breakpoint before error location
- [ ] Inspect variable values at each step
- [ ] Form hypothesis about root cause
- [ ] Test hypothesis with minimal change
- [ ] Verify fix resolves the error
- [ ] Consider adding error boundary or validation
