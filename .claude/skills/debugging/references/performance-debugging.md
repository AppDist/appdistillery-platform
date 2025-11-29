# Performance Debugging Reference

Debugging slow applications, performance bottlenecks, and optimization strategies.

## Contents

- Performance measurement
- React performance
- Database performance
- Bundle optimization
- Network debugging
- Memory issues

## Performance Measurement

### The Golden Rule

> **Measure first, optimize second.**

Never optimize based on assumptions. Always profile to find actual bottlenecks.

### Quick Performance Check

```typescript
// Simple timing utility
function measure<T>(label: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  console.log(`[Perf] ${label}: ${(performance.now() - start).toFixed(2)}ms`)
  return result
}

// Async version
async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  console.log(`[Perf] ${label}: ${(performance.now() - start).toFixed(2)}ms`)
  return result
}

// Usage
const data = await measureAsync('fetchProposals', () => fetchProposals())
```

### Browser DevTools Performance

1. **Open DevTools** → Performance tab
2. **Click Record** (⚫)
3. **Perform the slow action**
4. **Stop recording**
5. **Analyze**:
   - Look for long tasks (>50ms)
   - Check for layout thrashing
   - Identify slow functions

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | ≤4.0s | >4.0s |
| FID (First Input Delay) | ≤100ms | ≤300ms | >300ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 |

```typescript
// Measure Web Vitals
import { onCLS, onFID, onLCP } from 'web-vitals'

onCLS(console.log)
onFID(console.log)
onLCP(console.log)
```

## React Performance

### Identifying Re-render Issues

**React DevTools Profiler:**
1. Open React DevTools → Profiler tab
2. Click record
3. Perform action
4. Analyze flame graph
5. Look for components rendering unexpectedly

**Highlight Updates:**
1. React DevTools → Components tab
2. Settings (⚙️) → "Highlight updates when components render"
3. Interact with app
4. Watch for unnecessary highlights

### Common Re-render Causes

#### 1. Inline Objects/Functions

```typescript
// ❌ Bad: New object every render
<Component style={{ color: 'red' }} />
<Component onClick={() => doSomething()} />

// ✅ Good: Stable references
const style = useMemo(() => ({ color: 'red' }), [])
const onClick = useCallback(() => doSomething(), [])

<Component style={style} />
<Component onClick={onClick} />
```

#### 2. Context Re-renders

```typescript
// ❌ Bad: All consumers re-render on any change
const AppContext = createContext({ user: null, theme: 'light' })

// ✅ Good: Split contexts by change frequency
const UserContext = createContext(null)
const ThemeContext = createContext('light')

// Or memoize context value
const value = useMemo(() => ({ user, theme }), [user, theme])
<AppContext.Provider value={value}>
```

#### 3. Missing Memoization

```typescript
// ❌ Bad: Expensive calculation every render
function Component({ items }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name))
  return <List items={sorted} />
}

// ✅ Good: Memoize expensive operations
function Component({ items }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  return <List items={sorted} />
}
```

### React.memo Best Practices

```typescript
// Memoize components that:
// 1. Render often with same props
// 2. Render slowly
// 3. Are passed to lists

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Heavy render logic
})

// With custom comparison
const OptimizedComponent = memo(
  function OptimizedComponent({ user, onClick }) {
    return <div onClick={onClick}>{user.name}</div>
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.user.id === nextProps.user.id
  }
)
```

### useCallback and useMemo Guidelines

```typescript
// ✅ Use useCallback when:
// 1. Passing callbacks to memoized children
// 2. Callbacks are dependencies of other hooks

// ✅ Use useMemo when:
// 1. Computing expensive values
// 2. Creating objects/arrays passed as props
// 3. Values are dependencies of other hooks

// ❌ Don't over-memoize:
// Simple calculations are cheaper than memoization
const doubled = count * 2  // No useMemo needed!
```

## Database Performance

### Query Analysis

```typescript
// Analyze query performance
const { data } = await supabase
  .from('proposals')
  .select('*')
  .eq('org_id', orgId)
  .explain({ analyze: true, format: 'text' })

console.log('Query Plan:\n', data)
```

**What to look for:**
- `Seq Scan` → Needs index
- `Hash Join` → Usually efficient
- `Nested Loop` → Check row counts
- `Sort` → Consider index with ORDER BY

### Indexing Strategy

```sql
-- Index for frequent filters
CREATE INDEX idx_proposals_org_id ON proposals(org_id);

-- Index for sorting
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_proposals_org_status ON proposals(org_id, status);

-- Partial index for specific conditions
CREATE INDEX idx_active_proposals ON proposals(org_id) 
WHERE status = 'active';
```

### N+1 Query Prevention

```typescript
// ❌ N+1: One query per item
const proposals = await supabase.from('proposals').select('*')
for (const p of proposals.data) {
  const items = await supabase.from('items').select('*').eq('proposal_id', p.id)
}

// ✅ Single query with join
const { data } = await supabase
  .from('proposals')
  .select(`
    *,
    items:proposal_items(*)
  `)
```

## Bundle Optimization

### Analyzing Bundle Size

```bash
# Next.js bundle analysis
ANALYZE=true pnpm build

# Check specific chunks
ls -lh .next/static/chunks/*.js | sort -k5 -h

# Node script analysis
node scripts/analyze-bundle.js
```

### Common Bundle Issues

#### Large Dependencies

```bash
# Check dependency sizes
pnpm dlx bundlephobia-cli lodash
# Or visit: bundlephobia.com

# Find unused dependencies
pnpm dlx depcheck
```

#### Fixing Large Imports

```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash'
const result = _.pick(obj, ['a', 'b'])

// ✅ Good: Import specific function
import pick from 'lodash/pick'
const result = pick(obj, ['a', 'b'])

// ✅ Better: Use native methods when possible
const result = { a: obj.a, b: obj.b }
```

### Dynamic Imports

```typescript
// ❌ Static import loads on initial bundle
import HeavyChart from '@/components/HeavyChart'

// ✅ Dynamic import loads on demand
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Skip server-side rendering if not needed
})
```

## Network Debugging

### Monitoring Network Requests

```typescript
// Intercept and log fetch requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const start = performance.now()
  const url = typeof args[0] === 'string' ? args[0] : args[0].url
  
  try {
    const response = await originalFetch(...args)
    console.log(`[Fetch] ${url}: ${(performance.now() - start).toFixed(0)}ms`)
    return response
  } catch (error) {
    console.error(`[Fetch Error] ${url}:`, error)
    throw error
  }
}
```

### DevTools Network Tab

1. Open DevTools → Network tab
2. Record network activity
3. Look for:
   - Slow requests (>500ms)
   - Large responses (>1MB)
   - Waterfall bottlenecks
   - Failed requests (red)

### Caching Strategy

```typescript
// Cache API responses
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const response = await fetch(url)
  const data = await response.json()
  cache.set(url, { data, timestamp: Date.now() })
  return data
}
```

## Memory Issues

### Detecting Memory Leaks

**Chrome DevTools Memory Tab:**
1. Take heap snapshot
2. Perform suspected leaking action
3. Take another snapshot
4. Compare snapshots
5. Look for objects that shouldn't exist

### Common Memory Leaks

#### 1. Event Listeners

```typescript
// ❌ Leak: Listener never removed
useEffect(() => {
  window.addEventListener('resize', handleResize)
}, [])

// ✅ Fixed: Clean up on unmount
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

#### 2. Subscriptions

```typescript
// ❌ Leak: Subscription never unsubscribed
useEffect(() => {
  const channel = supabase.channel('changes').subscribe()
}, [])

// ✅ Fixed: Clean up subscription
useEffect(() => {
  const channel = supabase.channel('changes').subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

#### 3. Timers

```typescript
// ❌ Leak: Interval never cleared
useEffect(() => {
  setInterval(poll, 5000)
}, [])

// ✅ Fixed: Clear interval
useEffect(() => {
  const id = setInterval(poll, 5000)
  return () => clearInterval(id)
}, [])
```

## Performance Checklist

When investigating performance:

- [ ] Measure first - identify actual bottleneck
- [ ] Check React DevTools Profiler for re-renders
- [ ] Analyze network requests for slow APIs
- [ ] Check database queries with EXPLAIN ANALYZE
- [ ] Review bundle size for large dependencies
- [ ] Look for memory leaks in long-running sessions
- [ ] Check for layout thrashing in animations
- [ ] Verify images are optimized and lazy-loaded
- [ ] Test on slower devices/connections

## Quick Wins

```typescript
// 1. Lazy load heavy components
const Heavy = dynamic(() => import('./Heavy'), { ssr: false })

// 2. Debounce expensive operations
const debouncedSearch = useMemo(
  () => debounce(search, 300),
  []
)

// 3. Virtualize long lists
import { VirtualList } from 'react-virtual'

// 4. Optimize images
import Image from 'next/image'
<Image src={src} width={400} height={300} loading="lazy" />

// 5. Memoize expensive calculations
const processed = useMemo(() => expensiveProcess(data), [data])
```
