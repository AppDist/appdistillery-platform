---
id: TASK-1-12
title: Brain service tests
priority: P1-High
complexity: 2
module: core
status: COMPLETED
created: 2024-11-30
completed: 2025-12-02
---

# TASK-1-12: Brain service tests

## Description

Create comprehensive tests for brainHandle() and related services with mocked AI responses.

## Acceptance Criteria

- [x] Unit tests for brainHandle()
- [x] Mock Anthropic adapter responses
- [x] Test usage recording integration
- [x] Test schema validation
- [x] Test error handling
- [x] Tests pass in CI

## Technical Notes

Testing strategy:
1. Mock the AI adapter to return predictable responses
2. Verify recordUsage is called with correct params
3. Test Zod schema validation
4. Test error scenarios

### Test Setup

```typescript
// packages/core/src/__tests__/brain/brain-handle.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { brainHandle } from '../../brain/brain-handle'
import { z } from 'zod'

// Mock the adapter
vi.mock('../../brain/adapters/anthropic', () => ({
  generateStructured: vi.fn(),
}))

// Mock recordUsage
vi.mock('../../ledger/record-usage', () => ({
  recordUsage: vi.fn(),
}))

describe('brainHandle', () => {
  const TestSchema = z.object({
    summary: z.string(),
    score: z.number(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns structured output matching schema', async () => {
    const mockResponse = { summary: 'Test', score: 85 }
    vi.mocked(generateStructured).mockResolvedValue({
      object: mockResponse,
      usage: { promptTokens: 100, completionTokens: 50 },
    })

    const result = await brainHandle({
      task: 'test.task',
      action: 'test:task:run',
      schema: TestSchema,
      prompt: 'Test prompt',
      orgId: 'org-123',
    })

    expect(result).toEqual(mockResponse)
  })

  it('records usage after successful generation', async () => {
    // ...test usage recording
  })

  it('throws on schema validation failure', async () => {
    // ...test invalid response handling
  })
})
```

### Files to Create/Modify

- `packages/core/src/__tests__/brain/brain-handle.test.ts`
- `packages/core/src/__tests__/brain/adapters/anthropic.test.ts`
- `packages/core/src/__tests__/mocks/ai-responses.ts` - Mock data

### Patterns to Follow

- Mock external dependencies (AI, database)
- Test happy path and error cases
- Use descriptive test names
- Group related tests with describe()

## Dependencies

- **Blocked by**: TASK-0-06 (Vitest), TASK-1-11 (brainHandle)
- **Blocks**: None (enables confidence in brain service)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-02 | Completed - Tests were implemented during TASK-1-11 |

## Implementation Notes

Tests were created as part of TASK-1-11 (brainHandle service) implementation:

**Test files created:**
- `packages/core/src/brain/brain-handle.test.ts` - 25 unit tests for brainHandle()
- `packages/core/src/brain/adapters/anthropic.test.ts` - 16 tests for Anthropic adapter
- `packages/core/src/__tests__/brain.test.ts` - Type interface tests

**Test coverage includes:**
- Success path (data, adapter params, options, recordUsage calls)
- Action format derivation (module.task → module:task:generate)
- Brain Units calculation (fixed costs, token-based fallback)
- Adapter failure handling (success: false returns)
- Unexpected error handling (thrown errors)
- Invalid taskType format validation
- Optional parameters (null/undefined tenantId, userId)
- Duration tracking
- Silent recordUsage failure handling

**Total: 169 tests passing in @appdistillery/core package**
