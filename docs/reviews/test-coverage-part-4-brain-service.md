# Test Coverage Review: Part 4 - Brain Service & Testing

**Review Date:** 2025-12-03
**Reviewer:** Test Engineer Agent
**Scope:** Brain service, adapters, integration tests, RLS isolation tests

## Overall Score: 88/100

**Summary:** The Brain service test coverage is comprehensive with excellent patterns and test quality. Strong adapter coverage across all three providers (Anthropic, OpenAI, Google). Integration tests verify end-to-end flows. RLS isolation tests ensure tenant security. Minor gaps exist in edge case coverage and shared utility testing.

---

## Test Coverage Breakdown

### 1. Brain Handle Core (brain-handle.test.ts)

**File:** `/packages/core/src/brain/brain-handle.test.ts`
**Lines:** 691 lines of tests
**Test Count:** ~50+ tests across 10 describe blocks

#### Coverage Analysis

**✅ Excellent Coverage:**
- Success path with all parameters
- Adapter parameter passing (system, user prompt, options)
- Action format derivation (`module.task` → `module:task:generate`)
- Brain Units calculation (fixed costs + token-based fallback)
- Adapter failure handling (returns `success: false`)
- Unexpected error handling (Error and non-Error throws)
- recordUsage integration (success and failure logging)
- Invalid taskType format validation
- Optional parameters (null/undefined tenantId, userId)
- Duration tracking (success and failure)

**✅ Excellent Test Patterns:**
- AAA structure (Arrange-Act-Assert)
- Clear test names describing behavior
- Proper mock setup with `beforeEach` cleanup
- Discriminated union type narrowing in assertions
- Edge case testing (empty strings, wrong format, multiple dots)

**Strengths:**
1. **Comprehensive error handling** - Tests all error paths including recordUsage failures
2. **Type safety verification** - Tests discriminated union narrowing with TypeScript
3. **Unit cost logic** - Tests both fixed costs and fallback calculation
4. **Mock isolation** - Clean separation between brain and ledger mocks

**Minor Gaps:**
- No tests for extremely long prompts (token limit edge cases)
- No tests for concurrent brainHandle calls (race conditions)
- No tests for schema validation failure (Zod parse errors)

**Score: 92/100**

---

### 2. Adapter Tests

#### 2.1 Anthropic Adapter (anthropic.test.ts)

**File:** `/packages/core/src/brain/adapters/anthropic.test.ts`
**Lines:** 365 lines of tests
**Test Count:** 16 tests

**Coverage:**
- ✅ Successful structured generation
- ✅ Default model usage (claude-sonnet-4-5-20250929)
- ✅ Custom model selection
- ✅ All options passed to generateObject
- ✅ Missing API key error
- ✅ Error sanitization (no sensitive data leakage)
- ✅ Rate limit detection and handling
- ✅ Timeout detection
- ✅ Retry logic with exponential backoff (3 max retries)
- ✅ Non-retryable error detection
- ✅ Status code-based retry (429, 503)
- ✅ Missing usage information handling
- ✅ totalTokens calculation fallback

**Strengths:**
1. Comprehensive retry testing with mock failure sequences
2. Security-focused error sanitization
3. Model constant validation (ANTHROPIC_MODELS)
4. v5 AI SDK compatibility (inputTokens/outputTokens)

**Score: 95/100**

#### 2.2 OpenAI Adapter (openai.test.ts)

**File:** `/packages/core/src/brain/adapters/openai.test.ts`
**Lines:** 369 lines of tests
**Test Count:** 16 tests

**Coverage:** (Same pattern as Anthropic)
- ✅ All core functionality mirrored
- ✅ OpenAI-specific models (GPT-5 family, GPT-4.1, O3)
- ✅ Same retry patterns

**Strengths:**
- Identical test structure ensures adapter consistency
- All OpenAI model versions covered

**Score: 95/100**

#### 2.3 Google Adapter (google.test.ts)

**File:** `/packages/core/src/brain/adapters/google.test.ts`
**Lines:** 522 lines of tests
**Test Count:** 26 tests (most comprehensive!)

**Coverage:** (Enhanced compared to others)
- ✅ All core functionality from Anthropic/OpenAI
- ✅ Google-specific models (Gemini 2.5 Pro, Flash, Flash Lite, Gemini 3)
- ✅ **Additional retry status codes** (502, 504)
- ✅ **Message-based retry detection** ("temporarily unavailable")
- ✅ **Case-insensitive error matching**
- ✅ **Singleton client pattern verification**
- ✅ **maxOutputTokens parameter verification** (not maxTokens)
- ✅ **Non-Error exception handling**
- ✅ **Non-retryable status code verification** (400)

**Strengths:**
1. Most comprehensive adapter test suite
2. Extra Google-specific edge cases
3. Singleton pattern testing prevents client recreation
4. More robust retry logic verification

**Notable Pattern:**
```typescript
it('retries on error with message "temporarily unavailable"', async () => {
  // Tests message-based detection beyond status codes
});

it('handles case-insensitive error message matching', async () => {
  // Tests 'RATE LIMIT EXCEEDED' matches 'rate limit'
});
```

**Score: 98/100** (Best in class!)

---

### 3. Integration Tests (core-kernel.test.ts)

**File:** `/packages/core/src/__tests__/integration/core-kernel.test.ts`
**Lines:** 363 lines of tests
**Test Count:** 11 tests across 4 describe blocks

#### Coverage Analysis

**✅ Excellent E2E Coverage:**

**1. User Journey - Auth & Tenant Setup**
- ✅ User creation via signup
- ✅ Auto-created user_profile via trigger
- ✅ Tenant creation (service role)
- ✅ Tenant membership verification (owner role)

**2. AI Integration - brainHandle**
- ✅ brainHandle returns structured output with tenant context
- ✅ Usage event recorded with correct tenant_id
- ✅ Tokens and action match expected values

**3. Personal Mode - No Tenant**
- ✅ brainHandle works without tenant (tenantId: null)
- ✅ Usage event has null tenant_id in Personal mode

**4. Error Handling**
- ✅ Failed brainHandle attempts
- ✅ Failed attempts recorded with units: 0
- ✅ Invalid taskType format handling

**Strengths:**
1. **Real database operations** (local Supabase required)
2. **Complete user journey** from signup to AI usage
3. **Both tenant and personal mode** coverage
4. **Cleanup included** in `afterAll`
5. **30-second timeouts** for async operations
6. **Graceful skip** if Supabase not configured

**Test Setup Quality:**
```typescript
// Proper test isolation with cleanup
afterAll(async () => {
  if (context.serviceClient) {
    await cleanupIntegrationTestData(context.serviceClient, context);
  }
}, 30000);
```

**Minor Gaps:**
- No multi-user concurrent access tests
- No tenant switching tests
- No module installation integration

**Score: 90/100**

---

### 4. RLS Isolation Tests (rls-isolation.test.ts)

**File:** `/packages/core/src/__tests__/security/rls-isolation.test.ts`
**Lines:** 480 lines of tests
**Test Count:** 18 tests across 3 describe blocks

#### Coverage Analysis

**✅ Comprehensive RLS Verification:**

**1. tenants table RLS**
- ✅ User A can see Tenant A
- ✅ User A cannot see Tenant B
- ✅ User B can see Tenant B
- ✅ User B cannot see Tenant A
- ✅ Each user sees only their own tenant when querying all

**2. tenant_members table RLS**
- ✅ Users can see own membership
- ✅ Users can see all members of their tenant
- ✅ Users cannot see members of other tenants
- ✅ Users cannot see other users' memberships

**3. usage_events table RLS**
- ✅ Users can see tenant usage events
- ✅ Users cannot see other tenants' usage events
- ✅ Users can see own Personal mode events (tenant_id IS NULL)
- ✅ Users cannot see other users' Personal mode events
- ✅ Aggregate queries return only accessible events

**Strengths:**
1. **Two-user isolation** - Tests both positive and negative access
2. **Personal mode coverage** - Tests NULL tenant_id isolation
3. **Aggregate query validation** - Ensures filtering works on .select('*')
4. **Real RLS policies** - Tests actual database policies, not mocks
5. **Excellent documentation** - 45 lines of pattern documentation for adding new tables

**Documentation Pattern (Lines 434-479):**
```typescript
/**
 * PATTERN DOCUMENTATION: Adding New Table Tests
 *
 * To add RLS isolation tests for a new table, follow this pattern:
 * 1. Add test data to fixtures.ts
 * 2. Add helper function to setup.ts
 * 3. Update TestContext
 * 4. Create records in beforeAll
 * 5. Add cleanup in cleanupTestData
 * 6. Add test suite following the pattern
 */
```

**Minor Gaps:**
- No role-based access control tests (admin vs member)
- No cross-tenant data leakage via joins
- No test for module-specific tenant isolation (e.g., agency_leads)

**Score: 92/100**

---

### 5. Legacy/Demonstration Tests (__tests__/brain.test.ts)

**File:** `/packages/core/src/__tests__/brain.test.ts`
**Lines:** 109 lines
**Test Count:** 5 tests

**Coverage:**
- ✅ BrainTask interface validation
- ✅ BrainResult type validation (success and failure)
- ✅ Invalid taskType format error

**Assessment:**
This appears to be an **early demonstration file** that predates `brain-handle.test.ts`. It tests type interfaces rather than implementation.

**Recommendation:** Consider removing or consolidating with `brain-handle.test.ts` to avoid duplication.

**Score: 60/100** (Redundant with brain-handle.test.ts)

---

## Missing Test Coverage (Gaps)

### Critical Gaps (None identified)

### High Priority Gaps

1. **Shared Adapter Utilities (shared.ts) - NOT TESTED**
   - File: `/packages/core/src/brain/adapters/shared.ts`
   - Lines: 162 lines of implementation
   - Functions NOT directly tested:
     - `sleep(ms)` - Utility function
     - `isRetryableError(error)` - Core retry logic
     - `sanitizeErrorMessage(error, adapterName)` - Security-critical
     - `extractUsage(usage)` - Token normalization
     - `withRetry<T>(operation, config)` - Retry orchestration
   - **Why Critical:** These functions are used by ALL adapters. Bugs here affect all providers.
   - **Risk:** Retry logic bugs could cause infinite loops or missed retries.
   - **Status:** Currently tested indirectly via adapter tests

2. **Module Registry Tests (TASK-1-27)**
   - File: Likely `/packages/core/src/modules/registry.ts`
   - Status: Backlog task exists
   - Impact: Module system validation

3. **Session Context Tests (TASK-1-28)**
   - File: Likely `/packages/core/src/auth/session-context.ts`
   - Status: Backlog task exists
   - Impact: Authentication flow

### Medium Priority Gaps

4. **Edge Cases in brainHandle**
   - Extremely long prompts (near token limits)
   - Concurrent calls (race conditions in usage recording)
   - Schema validation failures (Zod parse errors)

5. **RLS for Module Tables**
   - Example: `agency_leads`, `agency_briefs` isolation
   - Pattern exists in RLS tests, needs module-specific implementation

6. **Integration Test Expansion**
   - Multi-user concurrent usage
   - Tenant switching mid-session
   - Module installation/uninstallation flow

### Low Priority Gaps

7. **Performance Testing**
   - Load testing for brainHandle under high concurrency
   - Memory leak detection for long-running processes

8. **Browser Client Tests**
   - File: `/packages/core/src/auth/supabase-browser.test.ts` exists
   - Verify coverage for client-side auth flows

---

## Test Quality Assessment

### Strengths

1. **Consistent Test Structure**
   - All tests follow AAA pattern (Arrange-Act-Assert)
   - Clear, descriptive test names
   - Proper beforeEach/afterAll cleanup

2. **Mock Patterns**
   - Clean mock setup with vi.mock()
   - Proper mock clearing in beforeEach
   - Realistic mock data structures

3. **Type Safety**
   - Tests verify discriminated union narrowing
   - TypeScript compilation ensures type correctness
   - Zod schema integration tested

4. **Security Focus**
   - Error sanitization prevents data leakage
   - RLS isolation comprehensive
   - Tenant separation verified

5. **Documentation**
   - RLS tests include pattern documentation
   - Clear comments explain test intent
   - Setup files provide reusable helpers

### Areas for Improvement

1. **Direct Testing of Shared Utilities**
   - Create `shared.test.ts` for adapter utilities
   - Test `isRetryableError` with all edge cases
   - Test `sanitizeErrorMessage` with various error types
   - Test `extractUsage` with v4 and v5 SDK responses

2. **Test Organization**
   - Remove or consolidate legacy `__tests__/brain.test.ts`
   - Create consistent directory structure (all adapter tests in `adapters/` folder)

3. **Coverage Metrics**
   - Add coverage reporting to CI/CD
   - Set minimum coverage thresholds (80%+ for critical paths)

---

## Recommendations

### Immediate Actions (Critical)

1. **Create Shared Utilities Test** (PRIORITY 1)
   ```typescript
   // packages/core/src/brain/adapters/shared.test.ts
   import { describe, it, expect } from 'vitest';
   import {
     isRetryableError,
     sanitizeErrorMessage,
     extractUsage,
     withRetry,
     sleep,
   } from './shared';

   describe('shared utilities', () => {
     describe('isRetryableError', () => {
       it('returns true for status code 429', () => { /* ... */ });
       it('returns true for status code 502', () => { /* ... */ });
       it('returns true for rate limit message', () => { /* ... */ });
       it('returns false for status code 400', () => { /* ... */ });
       it('returns false for non-Error objects', () => { /* ... */ });
     });

     describe('sanitizeErrorMessage', () => {
       it('sanitizes rate limit errors', () => { /* ... */ });
       it('sanitizes timeout errors', () => { /* ... */ });
       it('sanitizes API errors', () => { /* ... */ });
       it('returns generic message for unknown errors', () => { /* ... */ });
     });

     describe('extractUsage', () => {
       it('handles v5 SDK (inputTokens/outputTokens)', () => { /* ... */ });
       it('handles v4 SDK (promptTokens/completionTokens)', () => { /* ... */ });
       it('calculates totalTokens if missing', () => { /* ... */ });
       it('handles undefined usage', () => { /* ... */ });
     });

     describe('withRetry', () => {
       it('succeeds on first attempt', () => { /* ... */ });
       it('retries on retryable error', () => { /* ... */ });
       it('does not retry on non-retryable error', () => { /* ... */ });
       it('respects maxRetries limit', () => { /* ... */ });
       it('applies exponential backoff', () => { /* ... */ });
       it('respects maxDelayMs ceiling', () => { /* ... */ });
     });
   });
   ```

2. **Complete TASK-1-26: Google Adapter Tests** (ALREADY DONE ✅)
   - Status: Google adapter tests exist and are comprehensive
   - Marked as complete

3. **Complete TASK-1-27: Module Registry Tests**
   - Create tests for module registration/discovery
   - Verify manifest validation

4. **Complete TASK-1-28: Session Context Tests**
   - Test session retrieval and validation
   - Verify tenant context switching

### Short-term Actions (High Priority)

5. **Expand RLS Tests for Module Tables**
   - Add `agency_leads` isolation tests
   - Add `agency_briefs` isolation tests
   - Follow existing RLS test pattern

6. **Add Edge Case Tests to brainHandle**
   ```typescript
   describe('brainHandle edge cases', () => {
     it('handles extremely long prompts (near token limits)', () => { /* ... */ });
     it('handles concurrent calls without race conditions', () => { /* ... */ });
     it('handles Zod schema validation failures', () => { /* ... */ });
   });
   ```

7. **Add Integration Test Scenarios**
   - Multi-user concurrent usage
   - Tenant switching workflow
   - Module installation + usage workflow

### Long-term Actions (Medium Priority)

8. **Add Coverage Reporting**
   ```bash
   # Update package.json
   "scripts": {
     "test:coverage": "vitest run --coverage"
   }

   # Set coverage thresholds in vitest.config.ts
   coverage: {
     lines: 80,
     functions: 80,
     branches: 75,
     statements: 80,
   }
   ```

9. **Performance Testing Framework**
   - Load testing for concurrent brainHandle calls
   - Memory profiling for long-running processes

10. **Remove Redundant Tests**
    - Archive or remove `__tests__/brain.test.ts` (covered by brain-handle.test.ts)
    - Consolidate test helpers

---

## Test Statistics Summary

| Category | Files | Tests | Lines | Score |
|----------|-------|-------|-------|-------|
| Brain Handle Core | 1 | 50+ | 691 | 92/100 |
| Anthropic Adapter | 1 | 16 | 365 | 95/100 |
| OpenAI Adapter | 1 | 16 | 369 | 95/100 |
| Google Adapter | 1 | 26 | 522 | 98/100 |
| Integration Tests | 1 | 11 | 363 | 90/100 |
| RLS Isolation Tests | 1 | 18 | 480 | 92/100 |
| Shared Utilities | 0 | 0 | 0 | **0/100** ⚠️ |
| **TOTAL** | **6** | **137+** | **2,790** | **88/100** |

**Pass Rate:** 276 passed / 310 total = **89% pass rate** ✅
**Skipped Tests:** 34 (integration tests when Supabase unavailable)

---

## Conclusion

The Brain Service test coverage is **excellent overall (88/100)** with comprehensive coverage of core functionality, all three AI adapters, end-to-end integration flows, and security isolation. The test quality is high with consistent patterns, proper mocking, and clear documentation.

**Key Strengths:**
- All three adapters (Anthropic, OpenAI, Google) thoroughly tested
- Google adapter has best-in-class coverage (98/100)
- Integration tests verify complete user journeys
- RLS isolation tests ensure tenant security
- Excellent test patterns and documentation

**Critical Gap:**
- Shared adapter utilities (`shared.ts`) have **no direct tests** - only tested indirectly via adapter tests. This is the highest priority gap.

**Next Steps:**
1. Create `shared.test.ts` (CRITICAL)
2. Complete TASK-1-27 (Module Registry Tests)
3. Complete TASK-1-28 (Session Context Tests)
4. Expand RLS tests for module tables
5. Add edge case coverage to brainHandle

The foundation is strong. Addressing the shared utilities gap and completing the backlog tasks will bring coverage to 95/100.
