# Test Debugging Reference

Debugging test failures, flaky tests, and testing infrastructure issues.

## Contents

- Test failure analysis
- Flaky test diagnosis
- Mock debugging
- Async test issues
- Environment setup
- Coverage debugging

## Test Failure Analysis

### Reading Test Output

```
FAIL  src/components/Button.test.tsx
  ✓ renders button text (5 ms)
  ✕ calls onClick handler (12 ms)
  ✓ applies disabled state (3 ms)

  ● Button › calls onClick handler

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 0

      15 |     const onClick = vi.fn()
      16 |     render(<Button onClick={onClick}>Click</Button>)
    > 17 |     fireEvent.click(screen.getByRole('button'))
         |              ^
      18 |     expect(onClick).toHaveBeenCalledTimes(1)

    at Object.<anonymous> (src/components/Button.test.tsx:17:14)
```

**Extracting key info:**
1. **Which test failed**: "calls onClick handler"
2. **What was expected**: 1 call
3. **What happened**: 0 calls
4. **Location**: Line 17, the click event

### Isolating Test Failures

```bash
# Run single test file
pnpm vitest run src/components/Button.test.tsx

# Run single test by name
pnpm vitest run -t "calls onClick handler"

# Run with verbose output
pnpm vitest run --reporter=verbose

# Watch mode for iteration
pnpm vitest src/components/Button.test.tsx
```

### Test Debugging Methods

```bash
# Method 1: JavaScript Debug Terminal (fastest)
# Open: Cmd/Ctrl+Shift+P > "JavaScript Debug Terminal"
pnpm vitest

# Method 2: VSCode launch config
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${relativeFile}"],
  "console": "integratedTerminal"
}

# Method 3: Node inspector
pnpm vitest --inspect-brk --single-thread
# Then open chrome://inspect
```

## Flaky Test Diagnosis

### Identifying Flaky Tests

**Symptoms:**
- Passes locally, fails in CI
- Fails intermittently on same code
- Passes when run alone, fails with other tests

```bash
# Run test multiple times to detect flakiness
for i in {1..10}; do pnpm vitest run path/to/test.test.ts; done

# Run in CI-like environment
CI=true pnpm vitest run
```

### Common Causes of Flakiness

#### 1. Timing Issues

```typescript
// ❌ Flaky: Race condition
test('shows loading then data', async () => {
  render(<DataComponent />)
  expect(screen.getByText('Loading')).toBeInTheDocument()
  expect(screen.getByText('Data')).toBeInTheDocument()  // Might not exist yet
})

// ✅ Stable: Wait for element
test('shows loading then data', async () => {
  render(<DataComponent />)
  expect(screen.getByText('Loading')).toBeInTheDocument()
  expect(await screen.findByText('Data')).toBeInTheDocument()
})
```

#### 2. Test Pollution

```typescript
// ❌ Flaky: Shared state between tests
let counter = 0

test('increments counter', () => {
  counter++
  expect(counter).toBe(1)  // Fails if another test ran first
})

// ✅ Stable: Reset state in each test
let counter = 0

beforeEach(() => {
  counter = 0
})

test('increments counter', () => {
  counter++
  expect(counter).toBe(1)
})
```

#### 3. Non-Deterministic Data

```typescript
// ❌ Flaky: Random values
test('creates user', () => {
  const user = createUser()  // Generates random ID
  expect(user.id).toBe('abc123')  // Will fail randomly
})

// ✅ Stable: Use fixed seeds or match patterns
test('creates user', () => {
  const user = createUser()
  expect(user.id).toMatch(/^[a-z0-9]+$/)  // Match pattern
})

// Or seed the random generator
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})
```

#### 4. Time Dependencies

```typescript
// ❌ Flaky: Real time
test('shows relative time', () => {
  render(<TimeAgo date={new Date()} />)
  expect(screen.getByText('just now')).toBeInTheDocument()  // Depends on timing
})

// ✅ Stable: Mock time
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

test('shows relative time', () => {
  const oneHourAgo = new Date('2024-01-15T11:00:00Z')
  render(<TimeAgo date={oneHourAgo} />)
  expect(screen.getByText('1 hour ago')).toBeInTheDocument()
})
```

## Mock Debugging

### Verifying Mock Setup

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()

// After test execution, inspect mock
console.log('Called?', mockFn.mock.calls.length > 0)
console.log('Call count:', mockFn.mock.calls.length)
console.log('All calls:', mockFn.mock.calls)
console.log('Last call:', mockFn.mock.lastCall)
console.log('Results:', mockFn.mock.results)

// Assert on mock calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(1)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('final', 'args')
```

### Module Mock Issues

```typescript
// ❌ Wrong: Mock not applied
import { fetchData } from './api'
vi.mock('./api')  // Too late! Import already happened

// ✅ Correct: Mock before imports (hoisted automatically by vitest)
vi.mock('./api')
import { fetchData } from './api'

// Or use vi.hoisted for explicit hoisting
const { fetchData } = vi.hoisted(() => {
  return {
    fetchData: vi.fn()
  }
})
vi.mock('./api', () => ({ fetchData }))
```

### Partial Mocking

```typescript
// Keep some real implementations
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>()
  return {
    ...actual,
    expensiveFunction: vi.fn(),  // Only mock this one
  }
})
```

### Resetting Mocks

```typescript
// Reset between tests
beforeEach(() => {
  vi.clearAllMocks()  // Clear call history
})

afterEach(() => {
  vi.restoreAllMocks()  // Restore original implementations
})

// Or per-mock
mockFn.mockClear()  // Clear calls
mockFn.mockReset()  // Clear + remove implementation
mockFn.mockRestore()  // Restore original (if spy)
```

## Async Test Issues

### Common Async Problems

#### Missing await

```typescript
// ❌ Test passes before assertion runs
test('fetches data', () => {
  const promise = fetchData()
  expect(data).toBeDefined()  // Runs immediately, data is undefined
})

// ✅ Wait for promise
test('fetches data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})
```

#### Not Waiting for UI Updates

```typescript
// ❌ Element doesn't exist yet
test('shows result after click', () => {
  render(<AsyncComponent />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Result')).toBeInTheDocument()  // Fails!
})

// ✅ Wait for element
test('shows result after click', async () => {
  render(<AsyncComponent />)
  fireEvent.click(screen.getByRole('button'))
  expect(await screen.findByText('Result')).toBeInTheDocument()
})
```

#### Timeout Configuration

```typescript
// Increase timeout for slow operations
test('slow operation', async () => {
  // ...
}, 10000)  // 10 second timeout

// Or configure globally
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
```

### Act Warnings

```typescript
// Warning: An update to X inside a test was not wrapped in act(...)

// ✅ Use waitFor for state updates
import { waitFor } from '@testing-library/react'

test('updates state', async () => {
  render(<Counter />)
  fireEvent.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})

// ✅ For hooks, use act explicitly
import { act, renderHook } from '@testing-library/react'

test('updates hook state', () => {
  const { result } = renderHook(() => useCounter())
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

## Environment Setup

### Test Environment Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Environment
    environment: 'jsdom',  // or 'happy-dom', 'node'
    
    // Global setup
    setupFiles: ['./test/setup.ts'],
    
    // Environment variables
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    },
    
    // Globals (describe, it, expect without import)
    globals: true,
    
    // Coverage
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'test/**'],
    },
  },
})
```

### Setup File

```typescript
// test/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})
```

### Missing Environment Variables

```typescript
// Detect missing env vars in tests
// test/setup.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'DATABASE_URL',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in test environment`)
  }
}
```

## Coverage Debugging

### Running Coverage

```bash
# Run with coverage
pnpm vitest run --coverage

# Coverage for specific file
pnpm vitest run --coverage src/utils/format.ts

# Open HTML report
open coverage/index.html
```

### Understanding Coverage Metrics

| Metric | Meaning | Target |
|--------|---------|--------|
| Statements | % of statements executed | 80%+ |
| Branches | % of if/else branches taken | 70%+ |
| Functions | % of functions called | 80%+ |
| Lines | % of lines executed | 80%+ |

### Excluding Code from Coverage

```typescript
// Exclude entire file
// vitest.config.ts
coverage: {
  exclude: ['src/types/**', 'src/**/*.d.ts']
}

// Exclude specific lines
/* v8 ignore next */
if (process.env.NODE_ENV === 'development') {
  // Development-only code
}

/* v8 ignore start */
function debugOnly() {
  // Entire function excluded
}
/* v8 ignore stop */
```

## Test Debugging Checklist

When tests fail:

- [ ] Read the full error message and assertion
- [ ] Run the test in isolation
- [ ] Add console.log to trace execution
- [ ] Set breakpoints in JavaScript Debug Terminal
- [ ] Check if async operations are properly awaited
- [ ] Verify mocks are set up correctly
- [ ] Check for test pollution (run tests in different order)
- [ ] Verify environment variables are set
- [ ] Check if setup/cleanup hooks are running
- [ ] Consider if it's a flaky test (run multiple times)

## Quick Commands

```bash
pnpm vitest run path/to/test.ts -t "test name"  # Single test
pnpm vitest run --coverage                       # With coverage
pnpm vitest --ui                                 # UI mode
rm -rf node_modules/.vitest                      # Clear cache
```
