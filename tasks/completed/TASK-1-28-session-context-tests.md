---
id: TASK-1-28
title: Create getSessionContext tests
priority: P2-Medium
complexity: 2
module: core
status: BACKLOG
created: 2025-12-02
review-id: M1
fix-phase: 3
---

# TASK-1-28: Create getSessionContext Tests

## Description

`getSessionContext()` is a critical function with no direct tests. Create comprehensive tests covering all authentication paths, tenant resolution, and error handling.

## Acceptance Criteria

- [ ] All authentication paths tested
- [ ] Error handling paths covered
- [ ] Cookie-based tenant resolution tested
- [ ] Tests pass in CI environment

## Technical Notes

### Test Cases

```typescript
describe('getSessionContext', () => {
  it('should return null when not authenticated')
  it('should return user profile when authenticated')
  it('should return null tenant when no active_tenant_id cookie')
  it('should return tenant and membership when cookie set')
  it('should fallback to personal mode on membership error')
  it('should handle profile fetch errors gracefully')
})
```

### Files to Create

- `packages/core/src/auth/session.test.ts` - New test file

### Mocking Strategy

```typescript
// Mock Supabase client
vi.mock('../supabase/server', () => ({
  createSupabaseServer: vi.fn(() => mockSupabaseClient)
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookieStore)
}))
```

### Patterns to Follow

- Mock Supabase auth.getUser() responses
- Mock cookie store for tenant_id cookie
- Test all discriminated union result types
- Cover edge cases (missing profile, invalid tenant, etc.)

## Implementation Agent

- **Implement**: `test-engineer`
- **Review**: `code-reviewer`, `security-auditor`

## Execution

- **Mode**: Parallel with H1, H3
- **Phase**: Fix Phase 3 (Testing Coverage)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding M1 |
