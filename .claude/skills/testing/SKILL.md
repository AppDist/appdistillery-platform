---
name: testing
description: Comprehensive testing skill for maintaining high-quality tests across sessions and projects. Supports TDD workflows, test diagnosis, and adapts to project-specific testing stacks (Vitest, Jest, Playwright, Cypress, React Testing Library, Testing Library variants). Use when writing tests, implementing TDD, debugging test failures, ensuring test quality, or setting up testing infrastructure. Emphasizes tests that fail for the right reasons and proper bug vs test diagnosis.
---

# Testing Patterns for AppDistillery Platform

Testing guidance for the AppDistillery Platform, emphasizing TDD, proper test structure, and tests that fail for the right reasons.

## Quick Reference

**Stack:**
- Vitest - Unit/integration testing
- React Testing Library - Component testing
- Playwright - E2E testing (future)

**Commands:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
pnpm --filter @appdistillery/core test  # Single package
```

## Core Philosophy

**Tests are specifications of behavior.** When tests fail, ask: "Is the code broken, or is the test wrong?"

### Test vs Bug Diagnosis

```
Test Failed
    ↓
Is the test correctly written?
    ↓
YES → Bug in CODE → Fix the code
NO  → Bug in TEST → Fix the test
```

**Diagnostic Questions:**
1. What was the test trying to verify?
2. Is the expected behavior correct?
3. Is the test implementation correct?
4. Is the code implementation wrong?

## TDD: Red-Green-Refactor

### Phase 1: RED - Write a Failing Test

```typescript
// ❌ RED: Test fails because function doesn't exist yet
import { describe, it, expect, vi } from 'vitest';
import { generateScope } from './actions';

describe('generateScope', () => {
  it('calls brainHandle with correct task', async () => {
    const input = { leadId: 'lead-123', requirements: 'Build a website' };

    await generateScope(input);

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'agency.scope',
      })
    );
  });
});
```

**Critical Checkpoints:**
- ✅ Test fails with a meaningful error
- ✅ Test describes the expected behavior clearly
- ❌ Test passes immediately (indicates test isn't testing anything)

### Phase 2: GREEN - Make It Pass (Minimal Code)

```typescript
// ✅ GREEN: Minimal implementation
export async function generateScope(input: ScopeInput) {
  const result = await brainHandle({
    task: 'agency.scope',
    input,
    outputSchema: ScopeResultSchema,
  });
  return result.output;
}
```

**Key Principles:**
- Get to green as fast as possible
- Don't optimize prematurely
- Focus ONLY on making the current test pass

### Phase 3: REFACTOR - Improve While Staying Green

```typescript
// 🔄 REFACTOR: Add usage tracking while tests stay green
export async function generateScope(input: ScopeInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  const result = await brainHandle({
    task: 'agency.scope',
    input,
    outputSchema: ScopeResultSchema,
  });

  await recordUsage({
    orgId: session.orgId,
    action: 'agency:scope:generate',
    tokens: result.usage.totalTokens,
    cost: 50,
  });

  return result.output;
}
```

**Critical Rule:** If tests break during refactoring but behavior hasn't changed, the tests are testing implementation details. Fix the tests, not the refactored code.

## Testing AppDistillery Patterns

### Testing brainHandle Calls

```typescript
import { vi } from 'vitest';
import { brainHandle } from '@appdistillery/core/brain';

vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

describe('generateScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses correct brain task and schema', async () => {
    vi.mocked(brainHandle).mockResolvedValue({
      output: { deliverables: [], timeline: '2 weeks', assumptions: [] },
      usage: { totalTokens: 1000 },
    });

    await generateScope({ leadId: '123', requirements: 'test' });

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'agency.scope',
        outputSchema: expect.any(Object),
      })
    );
  });

  it('returns parsed AI output', async () => {
    const mockOutput = {
      deliverables: [{ title: 'MVP', description: 'Core features', estimatedHours: 40 }],
      timeline: '2 weeks',
      assumptions: ['Client provides content'],
    };

    vi.mocked(brainHandle).mockResolvedValue({
      output: mockOutput,
      usage: { totalTokens: 500 },
    });

    const result = await generateScope({ leadId: '123', requirements: 'test' });

    expect(result).toEqual(mockOutput);
  });
});
```

### Testing recordUsage Calls

```typescript
import { recordUsage } from '@appdistillery/core/ledger';

vi.mock('@appdistillery/core/ledger', () => ({
  recordUsage: vi.fn(),
}));

it('records usage with correct org_id and action', async () => {
  vi.mocked(brainHandle).mockResolvedValue({
    output: mockOutput,
    usage: { totalTokens: 1500 },
  });

  await generateScope({ leadId: '123', requirements: 'test' });

  expect(recordUsage).toHaveBeenCalledWith({
    orgId: 'org-123',  // From mocked session
    action: 'agency:scope:generate',
    tokens: 1500,
    cost: expect.any(Number),
  });
});
```

### Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createLead } from './actions/leads';

vi.mock('@appdistillery/core/auth', () => ({
  getSessionContext: vi.fn(() => ({
    orgId: 'org-123',
    userId: 'user-456',
  })),
}));

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: { id: 'lead-1' }, error: null })),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => mockSupabase,
}));

describe('createLead Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    vi.mocked(getSessionContext).mockResolvedValueOnce(null);

    await expect(createLead(formData)).rejects.toThrow('Unauthorized');
  });

  it('includes org_id in database insert', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Lead');
    formData.append('email', 'test@example.com');
    formData.append('requirements', 'Build a website');

    await createLead(formData);

    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-123',
        name: 'Test Lead',
        email: 'test@example.com',
      })
    );
  });
});
```

### Testing Zod Schema Validation

```typescript
import { LeadIntakeSchema } from './schemas';

describe('LeadIntakeSchema', () => {
  it('validates correct input', () => {
    const input = {
      name: 'Test Lead',
      email: 'test@example.com',
      requirements: 'Build a website',
    };

    const result = LeadIntakeSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  it('rejects invalid email', () => {
    const input = {
      name: 'Test',
      email: 'invalid-email',
      requirements: 'Something',
    };

    const result = LeadIntakeSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('email');
  });

  it('requires all fields', () => {
    const input = { name: 'Test' };

    const result = LeadIntakeSchema.safeParse(input);

    expect(result.success).toBe(false);
  });
});
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadForm } from './LeadForm';

describe('LeadForm', () => {
  it('renders all form fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LeadForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Test Lead');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/requirements/i), 'Build a website');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Lead',
      email: 'test@example.com',
      requirements: 'Build a website',
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();

    render(<LeadForm />);

    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

## Test Structure

### AAA Pattern (Arrange-Act-Assert)

```typescript
test('description of behavior', async () => {
  // ARRANGE: Set up test data and environment
  const input = { leadId: 'lead-123', requirements: 'Build a website' };
  vi.mocked(brainHandle).mockResolvedValue(mockResponse);

  // ACT: Perform the action being tested
  const result = await generateScope(input);

  // ASSERT: Verify the outcome
  expect(result.deliverables).toHaveLength(3);
  expect(result.timeline).toBe('2 weeks');
});
```

### Test Naming

**Formula:** `test('[unit] [scenario] [expected behavior]')`

```typescript
// ✅ GOOD: Clear, specific, behavior-focused
test('createLead returns error for invalid email', () => {});
test('generateScope calls brainHandle with agency.scope task', () => {});
test('LeadForm shows validation error when email is empty', () => {});

// ❌ BAD: Vague, implementation-focused
test('it works', () => {});
test('test validation', () => {});
test('should call handler', () => {});
```

### File Location

Place tests next to source files:

```
modules/agency/src/
├── actions/
│   ├── leads.ts
│   └── leads.test.ts    # Test file next to source
├── schemas/
│   ├── lead.ts
│   └── lead.test.ts
└── components/
    ├── LeadForm.tsx
    └── LeadForm.test.tsx
```

## What to Test

### ✅ DO TEST

- **Server Actions:** Business logic, validation, authorization
- **Zod Schemas:** Validation edge cases, required fields
- **brainHandle calls:** Correct task, input, schema
- **recordUsage calls:** Correct org_id, action, tokens
- **Tenant isolation:** All queries include org_id
- **Components:** User interactions, form submissions
- **Error handling:** What happens when things fail

### ❌ DON'T TEST

- Implementation details
- Third-party library internals
- Trivial getters/setters
- Framework boilerplate
- Private methods

## Anti-Patterns to Avoid

### Testing Implementation Details

```typescript
// ❌ BAD
test('uses Array.map internally', () => {
  const spy = vi.spyOn(Array.prototype, 'map');
  processItems([1, 2, 3]);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD
test('transforms all items correctly', () => {
  const result = processItems([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
});
```

### Over-Mocking

```typescript
// ❌ BAD: Mocking everything
test('processes lead', () => {
  const mockValidator = vi.fn().mockReturnValue(true);
  const mockDb = vi.fn().mockResolvedValue(true);
  const mockLogger = vi.fn();
  // Test doesn't test real integration
});

// ✅ GOOD: Mock only external boundaries
test('processes lead', async () => {
  // Real validation, real schema parsing
  // Only mock external services
  vi.mocked(brainHandle).mockResolvedValue(mockResponse);
});
```

### Shared State Between Tests

```typescript
// ❌ BAD: Shared instance across tests
const service = new UserService(); // Shared - tests affect each other!

// ✅ GOOD: Fresh instance per test
let service: UserService;
beforeEach(() => {
  service = new UserService();
});
```

## CI-Runnable Requirements

**All tests must pass with `pnpm test` (no environment variables required).**

### Test Categories

| Category | Marker | CI Behavior |
|----------|--------|-------------|
| Unit | (default) | Always runs |
| Integration | `@integration` | Skips if no Supabase |

### Unit Tests (Must Run in CI)

```typescript
// ✅ GOOD: Mocks external dependencies
vi.mock('@appdistillery/core/auth/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}));

test('creates lead with org_id', async () => {
  // Uses mock, runs in CI without Supabase
});
```

### Integration Tests (Mark Clearly)

```typescript
// ✅ GOOD: Clear skip condition and marker
const skipIfNoSupabase = !process.env.SUPABASE_SECRET_KEY;

// @integration - requires local Supabase
describe.skipIf(skipIfNoSupabase)('RLS Integration', () => {
  // These tests need real database
});
```

### Test Size Limits

| Ratio | Status |
|-------|--------|
| 1:1 test:code | Ideal |
| 2:1 test:code | Maximum |
| > 2:1 | Tests are too verbose - simplify |

### Mock Strategy

| Always Mock | Never Mock | Conditional |
|-------------|------------|-------------|
| AI providers | Pure functions | Supabase |
| External APIs | Zod schemas | Auth context |
| File system | Local utilities | - |

## Coverage Goals

| Category | Target | Notes |
|----------|--------|-------|
| Server Actions | 80%+ | Business logic, authorization |
| Schemas | 90%+ | All validation paths |
| Components | 70%+ | User interactions |
| Utils | 80%+ | Pure functions easy to test |

## Related Documentation

For detailed patterns, see:
- **[references/VITEST.md](references/VITEST.md)** - Vitest configuration and patterns
- **[references/REACT_TESTING_LIBRARY.md](references/REACT_TESTING_LIBRARY.md)** - Component testing
- **[references/TDD_WORKFLOWS.md](references/TDD_WORKFLOWS.md)** - Detailed TDD examples
- **[references/PLAYWRIGHT.md](references/PLAYWRIGHT.md)** - E2E testing patterns

## Cross-Skill Integration

When writing tests, also consult:
- **code-quality** - Code patterns, Server Action structure
- **project-context** - Architecture, module boundaries
- **debugging** - When tests reveal bugs
