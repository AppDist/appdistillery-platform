# Testing Patterns

Vitest testing patterns for AppDistillery Platform.

## Test Framework

AppDistillery uses Vitest for testing:

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

## Basic Test Structure

```typescript
// lead.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLead } from './leads';

describe('createLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a lead with valid input', async () => {
    // Arrange
    const input = {
      name: 'Test Lead',
      email: 'test@example.com',
      requirements: 'Build a website',
    };

    // Act
    const result = await createLead(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Test Lead');
  });

  it('returns error for invalid email', async () => {
    const input = {
      name: 'Test',
      email: 'invalid',
      requirements: 'Build something',
    };

    const result = await createLead(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });
});
```

## Mocking brainHandle

```typescript
import { vi } from 'vitest';
import { brainHandle } from '@appdistillery/core/brain';

vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

describe('generateScope', () => {
  it('calls brainHandle with correct params', async () => {
    vi.mocked(brainHandle).mockResolvedValue({
      output: { deliverables: [], timeline: '2 weeks', assumptions: [] },
      usage: { totalTokens: 1000 },
    });

    await generateScope({ leadId: '123', requirements: 'test' });

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'agency.scope',
      })
    );
  });
});
```

## Mocking Supabase

```typescript
import { vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => mockSupabase,
}));
```

## Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createLead } from './actions/leads';

vi.mock('@appdistillery/core/auth', () => ({
  getSessionContext: vi.fn(() => ({
    orgId: 'org-123',
    userId: 'user-456',
  })),
}));

describe('createLead Server Action', () => {
  it('includes org_id in insert', async () => {
    const formData = new FormData();
    formData.append('name', 'Test');
    formData.append('email', 'test@example.com');

    await createLead(formData);

    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-123',
      })
    );
  });
});
```

## Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadForm } from './LeadForm';

describe('LeadForm', () => {
  it('renders form fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LeadForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
```

## Test File Location

Place tests next to source files:

```
modules/agency/src/
├── actions/
│   ├── leads.ts
│   └── leads.test.ts    # Test file next to source
├── schemas/
│   ├── lead.ts
│   └── lead.test.ts
```

## Coverage Goals

- Server Actions: High coverage (business logic)
- Schemas: Test validation edge cases
- Components: Test interactions, not implementation

## Related Documentation

For full testing patterns and TDD workflows, see:
- `.claude/skills/testing/SKILL.md`
