# Testing Guide

Quick reference for running tests in AppDistillery Platform.

## Quick Start

```bash
# Run all tests
pnpm test

# Run tests in specific package
pnpm --filter @appdistillery/core test

# Watch mode
pnpm --filter @appdistillery/core test:watch

# Coverage
pnpm --filter @appdistillery/core test:coverage
```

## Test Locations

| Package | Test Location | Purpose |
|---------|--------------|---------|
| `packages/core/` | `src/**/__tests__/*.test.ts` | Core kernel unit tests |
| `modules/agency/` | `src/__tests__/**/*.test.ts` | Module-specific tests |
| `apps/web/` | `__tests__/**/*.test.ts` | Integration tests |

## Testing Stack

- **Framework**: Vitest
- **Assertions**: `expect` from Vitest
- **Mocking**: Vitest utilities
- **Database**: Supabase local instance

## Quick Examples

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { LeadIntakeSchema } from '../schemas/intake';

describe('LeadIntakeSchema', () => {
  it('validates correct lead data', () => {
    const data = { companyName: 'Acme', email: 'test@acme.com' };
    expect(() => LeadIntakeSchema.parse(data)).not.toThrow();
  });
});
```

### Server Action Test

```typescript
import { describe, it, expect } from 'vitest';
import { createLead } from '../actions/leads';

describe('createLead', () => {
  it('creates lead with tenant_id isolation', async () => {
    const result = await createLead({ /* ... */ });
    expect(result.success).toBe(true);
  });
});
```

## Critical Testing Rules

| Never | Always |
|-------|--------|
| Skip RLS tests | Test tenant isolation |
| Test implementation details | Test public interfaces |
| Mock excessively | Use real dependencies |

## Coverage Requirements

- **Core Kernel**: >80% coverage
- **Modules**: >70% coverage

## Detailed Patterns

For comprehensive testing guidance:
- **TDD workflows**: `.claude/skills/testing/SKILL.md`
- **Test diagnosis**: `.claude/skills/testing/references/diagnosis.md`
- **Mocking strategies**: `.claude/skills/testing/references/mocking.md`

## CI/CD

Tests run on:
- Pre-commit hooks
- Pull requests
- Main branch commits

## References

- `.claude/skills/testing/SKILL.md` - Full testing patterns
- `vitest.config.ts` - Configuration
