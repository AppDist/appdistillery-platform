# TDD Workflows for AppDistillery

Step-by-step TDD workflows for different scenarios using AppDistillery patterns.

## Workflow 1: Server Action TDD

**Scenario**: Implementing a new Server Action with brainHandle

### Step 1: Write First Test (RED)

```typescript
// modules/agency/src/actions/scope.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateScope } from './scope';
import { brainHandle } from '@appdistillery/core/brain';

vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

vi.mock('@appdistillery/core/auth', () => ({
  getSessionContext: vi.fn(() => ({
    orgId: 'org-123',
    userId: 'user-456',
  })),
}));

describe('generateScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls brainHandle with agency.scope task', async () => {
    vi.mocked(brainHandle).mockResolvedValue({
      output: { deliverables: [], timeline: '2 weeks', assumptions: [] },
      usage: { totalTokens: 1000 },
    });

    await generateScope({ leadId: '123', requirements: 'Build a website' });

    expect(brainHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'agency.scope',
      })
    );
  });
});
```

**Run**: `pnpm test` → Test FAILS (function doesn't exist)

### Step 2: Minimal Implementation (GREEN)

```typescript
// modules/agency/src/actions/scope.ts
'use server';

import { brainHandle } from '@appdistillery/core/brain';
import { ScopeResultSchema } from '../schemas';

export async function generateScope(input: { leadId: string; requirements: string }) {
  const result = await brainHandle({
    task: 'agency.scope',
    input,
    outputSchema: ScopeResultSchema,
  });

  return result.output;
}
```

**Run**: `pnpm test` → Test PASSES ✅

### Step 3: Test Auth Requirement (RED)

```typescript
it('throws error when not authenticated', async () => {
  vi.mocked(getSessionContext).mockResolvedValueOnce(null);

  await expect(generateScope({ leadId: '123', requirements: 'test' }))
    .rejects.toThrow('Unauthorized');
});
```

**Run**: Test FAILS

### Step 4: Add Auth Check (GREEN)

```typescript
export async function generateScope(input: { leadId: string; requirements: string }) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  const result = await brainHandle({
    task: 'agency.scope',
    input,
    outputSchema: ScopeResultSchema,
  });

  return result.output;
}
```

**Run**: Test PASSES ✅

### Step 5: Test Usage Recording (RED)

```typescript
import { recordUsage } from '@appdistillery/core/ledger';

vi.mock('@appdistillery/core/ledger', () => ({
  recordUsage: vi.fn(),
}));

it('records usage after successful generation', async () => {
  vi.mocked(brainHandle).mockResolvedValue({
    output: mockOutput,
    usage: { totalTokens: 1500 },
  });

  await generateScope({ leadId: '123', requirements: 'test' });

  expect(recordUsage).toHaveBeenCalledWith({
    orgId: 'org-123',
    action: 'agency:scope:generate',
    tokens: 1500,
    cost: expect.any(Number),
  });
});
```

### Step 6: Add Usage Recording (GREEN)

```typescript
export async function generateScope(input: { leadId: string; requirements: string }) {
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

**Run**: All tests PASS ✅

## Workflow 2: Zod Schema TDD

**Scenario**: Creating a validation schema for lead intake

### Step 1: Test Valid Input (RED)

```typescript
// modules/agency/src/schemas/lead.test.ts
import { describe, it, expect } from 'vitest';
import { LeadIntakeSchema } from './lead';

describe('LeadIntakeSchema', () => {
  it('validates correct input', () => {
    const input = {
      name: 'Test Lead',
      email: 'test@example.com',
      requirements: 'Build a website',
    };

    const result = LeadIntakeSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});
```

**Run**: Test FAILS (schema doesn't exist)

### Step 2: Create Schema (GREEN)

```typescript
// modules/agency/src/schemas/lead.ts
import { z } from 'zod';

export const LeadIntakeSchema = z.object({
  name: z.string(),
  email: z.string(),
  requirements: z.string(),
});

export type LeadIntake = z.infer<typeof LeadIntakeSchema>;
```

**Run**: Test PASSES ✅

### Step 3: Test Email Validation (RED)

```typescript
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
```

**Run**: Test FAILS

### Step 4: Add Email Validation (GREEN)

```typescript
export const LeadIntakeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  requirements: z.string().min(1),
});
```

**Run**: Test PASSES ✅

### Step 5: Add Descriptions for AI

```typescript
export const LeadIntakeSchema = z.object({
  name: z.string().min(1).describe('Full name of the lead contact'),
  email: z.string().email().describe('Email address for follow-up'),
  requirements: z.string().min(1).describe('Description of project requirements'),
});
```

## Workflow 3: Component TDD

**Scenario**: Building a lead form component

### Step 1: Write First Test (RED)

```typescript
// modules/agency/src/components/LeadForm.test.tsx
import { render, screen } from '@testing-library/react';
import { LeadForm } from './LeadForm';

describe('LeadForm', () => {
  it('renders all required fields', () => {
    render(<LeadForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/requirements/i)).toBeInTheDocument();
  });
});
```

**Run**: Test FAILS

### Step 2: Create Minimal Component (GREEN)

```typescript
// modules/agency/src/components/LeadForm.tsx
export function LeadForm() {
  return (
    <form>
      <label>
        Name
        <input name="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Requirements
        <textarea name="requirements" />
      </label>
    </form>
  );
}
```

**Run**: Test PASSES ✅

### Step 3: Test Form Submission (RED)

```typescript
import userEvent from '@testing-library/user-event';

it('calls onSubmit with form data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<LeadForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'Test Lead');
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/requirements/i), 'Build something');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Test Lead',
    email: 'test@example.com',
    requirements: 'Build something',
  });
});
```

### Step 4: Implement Form Handling (GREEN)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeadIntakeSchema } from '../schemas/lead';
import type { LeadIntake } from '../schemas/lead';

type LeadFormProps = {
  onSubmit?: (data: LeadIntake) => void;
};

export function LeadForm({ onSubmit }: LeadFormProps) {
  const form = useForm<LeadIntake>({
    resolver: zodResolver(LeadIntakeSchema),
  });

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit?.(data))}>
      <label>
        Name
        <input {...form.register('name')} />
      </label>
      <label>
        Email
        <input type="email" {...form.register('email')} />
      </label>
      <label>
        Requirements
        <textarea {...form.register('requirements')} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Run**: Test PASSES ✅

## Workflow 4: Database Query TDD

**Scenario**: Creating a query with tenant isolation

### Step 1: Test Tenant Isolation (RED)

```typescript
// modules/agency/src/actions/leads.test.ts
describe('getLeads', () => {
  it('filters by org_id from session', async () => {
    await getLeads();

    expect(mockSupabase.eq).toHaveBeenCalledWith('org_id', 'org-123');
  });
});
```

### Step 2: Implement with Tenant Filter (GREEN)

```typescript
export async function getLeads() {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('agency_leads')
    .select('*')
    .eq('org_id', session.orgId);

  if (error) throw error;
  return data;
}
```

## TDD Checklist for AppDistillery

For every Server Action:
- [ ] Write failing test for brainHandle call
- [ ] Implement minimal brainHandle usage
- [ ] Write failing test for auth check
- [ ] Add getSessionContext() check
- [ ] Write failing test for recordUsage
- [ ] Add usage recording
- [ ] Write failing test for tenant isolation (org_id)
- [ ] Add org_id to all database operations

## Common TDD Pitfalls

### Pitfall 1: Forgetting to Mock Core Services

```typescript
// ❌ BAD: Test calls real brainHandle
it('generates scope', async () => {
  const result = await generateScope(input);
  expect(result).toBeDefined();
});

// ✅ GOOD: Mock the dependency
vi.mock('@appdistillery/core/brain', () => ({
  brainHandle: vi.fn(),
}));

it('generates scope', async () => {
  vi.mocked(brainHandle).mockResolvedValue(mockResponse);
  const result = await generateScope(input);
  expect(result).toEqual(mockResponse.output);
});
```

### Pitfall 2: Not Testing Error Cases

```typescript
// ✅ Always test failure paths
it('throws when brainHandle fails', async () => {
  vi.mocked(brainHandle).mockRejectedValue(new Error('API error'));

  await expect(generateScope(input)).rejects.toThrow();
});
```

### Pitfall 3: Testing Implementation Instead of Behavior

```typescript
// ❌ BAD: Testing internal state
expect(component.state.isSubmitting).toBe(true);

// ✅ GOOD: Testing user-visible behavior
expect(screen.getByRole('button')).toBeDisabled();
expect(screen.getByText(/submitting/i)).toBeInTheDocument();
```

## Related

- [SKILL.md](../SKILL.md) - Main testing patterns
- [VITEST.md](VITEST.md) - Test runner configuration
- [REACT_TESTING_LIBRARY.md](REACT_TESTING_LIBRARY.md) - Component testing
