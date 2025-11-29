# Vitest Configuration for AppDistillery

> **Version**: Vitest 4.x
> **Official Docs**: https://vitest.dev

## AppDistillery Setup

### Installation

```bash
pnpm add -D vitest @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D happy-dom  # Or jsdom for DOM environment
```

### Workspace Configuration

In `packages/core/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/types/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@appdistillery/core': path.resolve(__dirname, './src'),
    },
  },
});
```

In `apps/web/vitest.config.ts` (for component tests):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'happy-dom', // Or 'jsdom'
    globals: true,
    setupFiles: ['./test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@appdistillery/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
```

### Test Setup File

`test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver (not available in jsdom/happy-dom)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch if needed
global.fetch = vi.fn();

// Set test environment
process.env.NODE_ENV = 'test';
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Basic Test Structure

```typescript
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { someFunction } from './module';

describe('someFunction', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('does expected behavior', () => {
    const result = someFunction('input');
    expect(result).toBe('expected');
  });

  test('handles error case', () => {
    expect(() => someFunction(null)).toThrow('Invalid input');
  });
});
```

## Async Testing

```typescript
test('async operation completes', async () => {
  const result = await fetchData(123);
  expect(result).toMatchObject({ id: 123 });
});

test('rejects on error', async () => {
  await expect(fetchData(999)).rejects.toThrow('Not found');
});
```

## Parametrized Tests

```typescript
test.each([
  { input: 'test@example.com', expected: true },
  { input: 'invalid', expected: false },
  { input: '@example.com', expected: false },
])('validates email: $input → $expected', ({ input, expected }) => {
  expect(validateEmail(input)).toBe(expected);
});
```

## Mocking

### Function Mocks

```typescript
test('calls callback with result', () => {
  const callback = vi.fn();
  processData('input', callback);

  expect(callback).toHaveBeenCalledWith('processed: input');
  expect(callback).toHaveBeenCalledTimes(1);
});
```

### Module Mocks

```typescript
// Mock entire module
vi.mock('./database', () => ({
  connect: vi.fn().mockResolvedValue(true),
  query: vi.fn().mockResolvedValue([{ id: 1 }]),
}));

// Partial mock
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();
  return {
    ...actual,
    dangerousFunction: vi.fn(),
  };
});
```

### Mocking AppDistillery Core Services

```typescript
// Mock brainHandle
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

// Mock recordUsage
vi.mock('@appdistillery/core/ledger', () => ({
  recordUsage: vi.fn(),
}));

// Mock auth
vi.mock('@appdistillery/core/auth', () => ({
  getSessionContext: vi.fn(() => ({
    orgId: 'org-123',
    userId: 'user-456',
  })),
}));
```

### Mocking Supabase

```typescript
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => mockSupabase,
}));
```

### Spying on Methods

```typescript
test('tracks method calls', () => {
  const obj = { save: () => true };
  const spy = vi.spyOn(obj, 'save');

  obj.save();

  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});
```

### Mocking Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('executes after delay', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected);           // Strict ===
expect(value).toEqual(expected);        // Deep equality
expect(value).toStrictEqual(expected);  // No undefined

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(n);
expect(value).toBeCloseTo(n, precision);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(n);
expect(object).toHaveProperty('key', value);
expect(object).toMatchObject(partial);

// Errors
expect(() => fn()).toThrow('message');
expect(promise).rejects.toThrow();

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(n);
```

## Test Lifecycle

```typescript
describe('Database operations', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  beforeEach(async () => {
    await database.clearData();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Tests here...
});
```

## Coverage

### Running Coverage

```bash
vitest run --coverage
vitest run --coverage --coverage.reporter=html
```

### Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

## Filtering Tests

```typescript
// Run only specific tests
test.only('this test will run', () => {});

// Skip tests
test.skip('skip this test', () => {});

// Skip conditionally
test.skipIf(process.env.CI)('skip in CI', () => {});
test.runIf(!process.env.CI)('run locally only', () => {});
```

## Debugging

```bash
# Run specific test file
vitest run path/to/test.test.ts

# Run tests matching pattern
vitest run --grep "pattern"

# UI mode
vitest --ui

# Verbose output
vitest --reporter=verbose
```

## Type-Safe Testing

```typescript
import { expectTypeOf } from 'vitest';

test('returns correct type', () => {
  const result = processData({ input: 'test' });

  expect(result).toHaveProperty('output');
  expectTypeOf(result).toEqualTypeOf<ProcessedData>();
  expectTypeOf(result.output).toBeString();
});
```

## Common Issues

**Tests hang:**
```typescript
test('long running', async () => {
  // ...
}, { timeout: 30000 }); // 30 seconds
```

**Mocks not working:**
```typescript
// Ensure mocks are hoisted
vi.mock('./module', () => ({ default: vi.fn() }));

// Reset between tests
afterEach(() => vi.clearAllMocks());
```

**Coverage inaccurate:**
```typescript
coverage: {
  exclude: ['**/*.{test,spec}.{ts,tsx}', '**/mocks/**'],
}
```

## Related

- [SKILL.md](../SKILL.md) - Main testing patterns
- [REACT_TESTING_LIBRARY.md](REACT_TESTING_LIBRARY.md) - Component testing
- [TDD_WORKFLOWS.md](TDD_WORKFLOWS.md) - TDD patterns
