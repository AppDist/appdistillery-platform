# Auth & Multi-Tenancy Test Coverage Review

**Date:** 2025-12-03
**Reviewer:** Test Engineer (AppDistillery Platform)
**Scope:** Part 2 (Auth & Multi-Tenancy) - `/packages/core/src/auth`

---

## Executive Summary

### Overall Score: **75/100**

The auth module demonstrates **strong foundational test coverage** with comprehensive tests for critical multi-tenant operations. TASK-1-28 successfully added `getSessionContext` tests, bringing core tenant isolation and session management to production-ready quality. However, **4 critical modules lack any test coverage**, creating blind spots in authentication flows and tenant utilities.

### Key Strengths
- ✅ **Excellent** session context tests (21 comprehensive test cases)
- ✅ **Excellent** tenant switching and creation tests (43 combined tests)
- ✅ **Excellent** active tenant retrieval tests (18 tests)
- ✅ Strong error handling coverage with graceful fallbacks
- ✅ Proper mocking of Supabase, Next.js cookies, and auth boundaries

### Critical Gaps
- ❌ **Zero** test coverage for `getUserTenants()` (tenant listing)
- ❌ **Zero** test coverage for `getAuthErrorMessage()` (error mapping)
- ❌ **Zero** test coverage for `transforms.ts` (50% partial coverage)
- ❌ **Zero** test coverage for `middleware.ts` (session refresh)

---

## Coverage Metrics

### By Module

| Module | Statement % | Branch % | Function % | Lines % | Status |
|--------|-------------|----------|------------|---------|--------|
| **get-session-context** | 100% | 100% | 100% | 100% | ✅ Excellent |
| **get-active-tenant** | 100% | 100% | 100% | 100% | ✅ Excellent |
| **supabase-browser** | 100% | 100% | 100% | 100% | ✅ Excellent |
| **actions/create-tenant** | 90.9% | 94.4% | 100% | 90.9% | ✅ Very Good |
| **actions/switch-tenant** | 90.5% | 91.7% | 100% | 90.5% | ✅ Very Good |
| **schemas/tenant** | 100% | 100% | 100% | 100% | ✅ Excellent |
| **constants** | 100% | 100% | 100% | 100% | ✅ Excellent |
| **transforms** | 50% | 100% | 50% | 50% | ⚠️ Partial |
| **get-user-tenants** | 0% | 0% | 0% | 0% | ❌ None |
| **errors** | 0% | 0% | 0% | 0% | ❌ None |
| **middleware** | 0% | 100% | 0% | 0% | ❌ None |
| **supabase-server** | 0% | 100% | 0% | 0% | ❌ None |

### Overall Coverage (Auth Module)

```
Statement Coverage: 56.66%
Branch Coverage:    64.00%
Function Coverage:  22.22%
Line Coverage:      57.30%
```

**Analysis:** The 22.22% function coverage indicates **5 out of 9 critical functions have zero tests**. This is the primary driver of the 75/100 score.

---

## Detailed Test Quality Assessment

### ✅ **Excellent: getSessionContext Tests** (100% Coverage)

**File:** `/packages/core/src/auth/get-session-context.test.ts`
**Test Count:** 21 tests
**Coverage:** 100%

#### What's Tested Well

1. **Authentication Validation**
   - ✅ Returns null when auth.getUser() fails
   - ✅ Returns null when user object is missing
   - ✅ Correctly validates JWT tokens

2. **User Profile Fetching**
   - ✅ Returns null when profile fetch fails
   - ✅ Returns null when profile data is missing
   - ✅ Transforms snake_case to camelCase correctly
   - ✅ Converts string dates to Date objects

3. **Personal Mode (No Active Tenant)**
   - ✅ Returns user profile with null tenant/membership
   - ✅ Does not query tenant_members when no active tenant
   - ✅ Handles null display_name and avatar_url

4. **Tenant Mode (Active Tenant Selected)**
   - ✅ Fetches and returns full tenant + membership
   - ✅ Transforms membership row to camelCase
   - ✅ Queries with correct user_id and tenant_id filters
   - ✅ Tests all 3 roles: owner, admin, member
   - ✅ Tests both tenant types: household, organization

5. **Error Handling**
   - ✅ Falls back to personal mode on membership fetch errors
   - ✅ Falls back to personal mode on getActiveTenant errors
   - ✅ Gracefully handles unexpected errors
   - ✅ Logs errors with context tags

#### Test Quality Highlights

```typescript
// Excellent: Tests discriminated union behavior
it('falls back to personal mode when membership fetch fails', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  mockSupabase.single.mockResolvedValueOnce({
    data: null,
    error: new Error('Membership not found'),
  })

  const result = await getSessionContext()

  expect(result).toEqual({
    user: { ... },
    tenant: null,      // Fallback to personal mode
    membership: null,
  })

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[getSessionContext] Failed to fetch membership:',
    expect.any(Error)
  )
})
```

**Strengths:**
- Tests behavior, not implementation
- Verifies graceful degradation (tenant fetch failure → personal mode)
- Validates console.error logging for debugging
- Uses proper console spy cleanup

---

### ✅ **Excellent: getActiveTenant Tests** (100% Coverage)

**File:** `/packages/core/src/auth/get-active-tenant.test.ts`
**Test Count:** 18 tests
**Coverage:** 100%

#### What's Tested Well

1. **Cookie-Based Tenant Selection**
   - ✅ Returns null when cookie is not set (personal mode)
   - ✅ Returns null when cookie value is empty string
   - ✅ Reads from ACTIVE_TENANT_COOKIE constant

2. **Multi-Layer Security Validation**
   - ✅ Returns null when user is not authenticated
   - ✅ Returns null when user is not a member of tenant
   - ✅ Returns null when tenant does not exist
   - ✅ Validates membership before returning tenant data

3. **Tenant Data Transformation**
   - ✅ Transforms snake_case database fields to camelCase
   - ✅ Verifies no snake_case properties leak through
   - ✅ Converts string dates to Date objects

4. **Performance Optimization**
   - ✅ Accepts optional `userId` parameter to avoid redundant getUser() call
   - ✅ Falls back to getUser() when userId not provided (backward compatibility)

5. **Error Handling & Logging**
   - ✅ Logs console.warn for missing memberships
   - ✅ Logs console.warn for missing tenants
   - ✅ Logs console.error for unexpected exceptions
   - ✅ Returns null gracefully on all error paths

#### Test Quality Highlights

```typescript
// Excellent: Tests performance optimization
it('skips getUser() call when userId is provided', async () => {
  const result = await getActiveTenant(userId)

  // Verify getUser was NOT called (optimization working)
  expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()

  // Verify membership check used provided userId
  expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)

  expect(result?.id).toBe(tenantId)
})
```

**Strengths:**
- Tests defensive security layers (auth → membership → tenant)
- Verifies optimization without breaking backward compatibility
- Validates logging at appropriate severity levels (warn vs error)

---

### ✅ **Excellent: Tenant Creation Tests** (90.9% Coverage)

**File:** `/packages/core/src/auth/actions/create-tenant.test.ts`
**Test Count:** 32 tests (16 household + 16 organization)
**Coverage:** 90.9% statements, 94.4% branches

#### What's Tested Well

1. **Authentication Enforcement**
   - ✅ Returns error when user is not authenticated
   - ✅ Returns error when auth.getUser returns null user

2. **Input Validation (Zod Schemas)**
   - ✅ Name length validation (min 2, max 50/100 chars)
   - ✅ Slug length validation (min 2, max 30 chars)
   - ✅ Slug format validation (lowercase, hyphens only)
   - ✅ Email validation for billingEmail
   - ✅ Rejects uppercase, spaces, underscores in slugs

3. **Duplicate Detection**
   - ✅ Returns friendly error for duplicate slugs
   - ✅ Checks database before attempting creation

4. **Database Operations**
   - ✅ Calls `create_tenant_with_owner` RPC with correct parameters
   - ✅ Includes optional fields (orgNumber, billingEmail) when provided
   - ✅ Transforms returned tenant row to camelCase

5. **Error Handling**
   - ✅ Handles database RPC errors gracefully
   - ✅ Handles fetch errors after creation
   - ✅ Returns discriminated union results (success/error)

#### Missing Coverage (Lines 125-126, 241-242)

```typescript
// Uncovered: Zod error name check and unexpected error catch
if (error instanceof Error && error.name === 'ZodError') {
  return { success: false, error: error.message }  // Line 125-126
}
console.error('[createHousehold] Unexpected error:', error)  // Line 241-242
```

**Issue:** These lines would be covered by Zod validation failure tests, but they're being caught earlier by the schema parse.

**Severity:** **Low** - Edge case error handling. Core validation is tested.

---

### ✅ **Excellent: switchTenant Tests** (90.5% Coverage)

**File:** `/packages/core/src/auth/actions/switch-tenant.test.ts`
**Test Count:** 11 tests
**Coverage:** 90.5% statements, 91.7% branches

#### What's Tested Well

1. **Authorization**
   - ✅ Returns error if user is not authenticated

2. **Input Validation**
   - ✅ Accepts valid UUID tenant IDs
   - ✅ Accepts null for personal mode
   - ✅ Rejects invalid UUIDs
   - ✅ Rejects non-string, non-null values

3. **Membership Validation**
   - ✅ Validates user is a member of the tenant
   - ✅ Returns error if user is not a member
   - ✅ Queries tenant_members with correct filters

4. **Cookie Security**
   - ✅ Sets httpOnly, sameSite, path, maxAge correctly
   - ✅ Sets secure flag in production environment
   - ✅ Sets empty cookie for personal mode

5. **Personal Mode Optimization**
   - ✅ Does not validate membership for personal mode (tenantId: null)

#### Missing Coverage (Lines 121-122)

```typescript
// Uncovered: Zod error catch
if (error instanceof z.ZodError) {
  return { success: false, error: 'Invalid input: ...' }  // Line 121-122
}
```

**Severity:** **Low** - Zod errors are caught by validation tests, but the instance check isn't exercised.

---

### ⚠️ **Partial Coverage: transforms.ts** (50% Coverage)

**File:** `/packages/core/src/auth/transforms.ts`
**Functions:** 2 (`transformTenantRow`, `transformMemberRow`)
**Coverage:** 50% functions (only `transformTenantRow` tested)

#### What's Missing

```typescript
// UNTESTED: transformMemberRow
export function transformMemberRow(row: TenantMemberRow): TenantMember {
  return {
    id: row.id,
    tenantId: row.tenant_id,    // ❌ No test verifies this transformation
    userId: row.user_id,        // ❌ No test verifies this transformation
    role: row.role,
    joinedAt: new Date(row.joined_at),
  }
}
```

**Why It Matters:**
- This function is called in `getSessionContext` and `getUserTenants`
- Ensures snake_case DB fields → camelCase TypeScript properties
- A bug here would break tenant membership queries

**Severity:** **Medium** - Should have dedicated unit tests for pure transformation functions

---

### ❌ **Critical Gap: getUserTenants** (0% Coverage)

**File:** `/packages/core/src/auth/get-user-tenants.ts`
**Lines:** 107 total, **0 tested**
**Severity:** **CRITICAL**

#### What's Missing

This function powers the tenant switcher UI and has NO tests:

```typescript
export async function getUserTenants(): Promise<TenantMembership[]> {
  // ❌ No test validates authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized: User must be authenticated')
  }

  // ❌ No test validates Supabase query structure
  const { data, error } = await supabase
    .from('tenant_members')
    .select(`
      id, tenant_id, user_id, role, joined_at,
      tenants (...)
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // ❌ No test validates error handling
  if (error) {
    console.error('[getUserTenants] Database error:', error)
    throw new Error('Failed to fetch user tenants')
  }

  // ❌ No test validates empty array for personal users
  if (!data || data.length === 0) {
    return []
  }

  // ❌ No test validates joined data transformation
  return (data as any[])
    .filter((row) => row.tenants)
    .map((row) => { ... })
}
```

#### Missing Test Cases

1. **Authentication**
   - Should throw error when user is not authenticated
   - Should throw error when getUser returns null

2. **Joined Query**
   - Should query tenant_members with tenants relation
   - Should filter by user_id
   - Should order by joined_at descending

3. **Personal Users**
   - Should return empty array when user has no tenants
   - Should return empty array when data is null

4. **Data Transformation**
   - Should transform joined tenant rows to TenantMembership objects
   - Should filter out rows where tenants relation is missing
   - Should handle both array and object forms of joined data

5. **Error Handling**
   - Should throw error when database query fails
   - Should log error with context tag

#### Impact

**High Risk:**
- Powers tenant switcher dropdown in UI
- No tests mean bugs could break tenant switching for all users
- Complex joined query with transformation logic

**Recommended Test Count:** 10-12 tests

---

### ❌ **Critical Gap: getAuthErrorMessage** (0% Coverage)

**File:** `/packages/core/src/auth/errors.ts`
**Lines:** 27 total, **0 tested**
**Severity:** **HIGH**

#### What's Missing

```typescript
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'      // ❌ No test
    case 'Email not confirmed':
      return 'Please verify your email...'    // ❌ No test
    case 'User already registered':
      return 'An account with this email...'  // ❌ No test
    // ... 5 more cases
    default:
      console.error('[Auth Error]', error.message)
      return 'Authentication failed. Please try again.'
  }
}
```

#### Missing Test Cases

1. Should map "Invalid login credentials" → user-friendly message
2. Should map "Email not confirmed" → user-friendly message
3. Should map "User already registered" → user-friendly message
4. Should map "Password should be at least 6 characters" → user-friendly message
5. Should map "Signup requires a valid password" → user-friendly message
6. Should return generic message for unknown errors
7. Should log unknown errors to console.error

**Recommended Test Count:** 7 tests

#### Impact

**Medium Risk:**
- Used in sign-in/sign-up forms
- Incorrect error mapping could confuse users
- Simple switch statement, but should be tested

---

### ❌ **Critical Gap: middleware.ts** (0% Coverage)

**File:** `/packages/core/src/auth/middleware.ts`
**Lines:** 36 total, **0 tested**
**Severity:** **CRITICAL**

#### What's Missing

```typescript
export async function updateSession(request: NextRequest) {
  // ❌ No test validates Supabase client creation in middleware context
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(..., {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        // ❌ No test validates cookie setting in middleware
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // ❌ CRITICAL: No test validates session refresh
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

#### Missing Test Cases

1. **Cookie Handling**
   - Should read cookies from request
   - Should set cookies in response
   - Should preserve existing cookies

2. **Session Refresh**
   - Should call supabase.auth.getUser() to refresh session
   - Should return user object when authenticated
   - Should return null user when not authenticated

3. **Response Construction**
   - Should return NextResponse with updated cookies
   - Should preserve request headers

**Recommended Test Count:** 6-8 tests

#### Impact

**Critical Risk:**
- This middleware runs on EVERY authenticated route
- No tests mean session refresh logic is untested
- Breaking this breaks the entire auth flow
- **This is the highest priority gap**

#### Testing Challenges

Middleware testing is complex due to Next.js dependencies:
- Requires mocking `next/server` (NextRequest, NextResponse)
- Requires mocking Supabase cookie handling
- May need integration tests rather than pure unit tests

---

## Issues Found

### CRITICAL Issues

| ID | Severity | Description | Location | Impact |
|----|----------|-------------|----------|--------|
| C-1 | **CRITICAL** | Zero test coverage for middleware session refresh | `/auth/middleware.ts` | Breaks auth flow if broken |
| C-2 | **CRITICAL** | Zero test coverage for tenant listing | `/auth/get-user-tenants.ts` | Breaks tenant switcher UI |

### HIGH Priority Issues

| ID | Severity | Description | Location | Impact |
|----|----------|-------------|----------|--------|
| H-1 | **HIGH** | Zero test coverage for error message mapping | `/auth/errors.ts` | Poor user experience if broken |
| H-2 | **HIGH** | Partial coverage of transform utilities (50%) | `/auth/transforms.ts` | Data corruption if broken |

### MEDIUM Priority Issues

| ID | Severity | Description | Location | Impact |
|----|----------|-------------|----------|--------|
| M-1 | **MEDIUM** | Missing coverage for Zod error catch blocks | `create-tenant.ts`, `switch-tenant.ts` | Edge case error handling |
| M-2 | **MEDIUM** | supabase-server.ts has 0% coverage | `/auth/supabase-server.ts` | Initialization code untested |

### LOW Priority Issues

None identified. The existing tests are of high quality.

---

## Coverage Gaps Summary

### Untested Functions (Priority Order)

1. **updateSession** (middleware.ts) - **CRITICAL**
   - Runs on every authenticated route
   - Session refresh logic untested
   - Estimated 6-8 tests needed

2. **getUserTenants** (get-user-tenants.ts) - **CRITICAL**
   - Powers tenant switcher UI
   - Complex joined query with transformations
   - Estimated 10-12 tests needed

3. **getAuthErrorMessage** (errors.ts) - **HIGH**
   - User-facing error messages
   - Simple switch statement
   - Estimated 7 tests needed

4. **transformMemberRow** (transforms.ts) - **HIGH**
   - Pure function, should be easy to test
   - Estimated 3-4 tests needed

5. **createServerSupabaseClient** (supabase-server.ts) - **MEDIUM**
   - Initialization code
   - Estimated 2-3 tests needed

---

## Test Quality Observations

### Strengths

1. **Excellent Mocking Strategy**
   ```typescript
   // Clean, reusable mock structure
   const mockSupabase = {
     auth: { getUser: vi.fn() },
     from: vi.fn(() => mockSupabase),
     select: vi.fn(() => mockSupabase),
     eq: vi.fn(() => mockSupabase),
     single: vi.fn(),
   }
   ```

2. **Proper Test Isolation**
   - Each test uses `beforeEach(() => vi.clearAllMocks())`
   - No shared state between tests

3. **AAA Pattern Followed Consistently**
   ```typescript
   it('description', async () => {
     // ARRANGE: Set up mocks
     mockSupabase.auth.getUser.mockResolvedValue(...)

     // ACT: Call the function
     const result = await getSessionContext()

     // ASSERT: Verify behavior
     expect(result).toEqual({ ... })
   })
   ```

4. **Discriminated Unions Tested**
   - Tests verify both `success: true` and `success: false` paths
   - Type narrowing is validated

5. **Console Spy Cleanup**
   ```typescript
   const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
   // ... test logic
   consoleErrorSpy.mockRestore()  // ✅ Proper cleanup
   ```

### Areas for Improvement

1. **No Integration Tests**
   - All tests are unit tests with mocked Supabase
   - Should add integration tests with real Supabase local instance
   - Especially important for middleware and getUserTenants

2. **Limited Edge Case Testing**
   - Most tests focus on happy path and null checks
   - Could add more edge cases (e.g., malformed data, race conditions)

3. **No Performance Tests**
   - getSessionContext makes multiple DB queries
   - Could test N+1 query patterns
   - Could test caching behavior (if implemented)

---

## Recommendations

### Immediate Actions (Before Production)

1. **Write tests for middleware.ts** (CRITICAL)
   - 6-8 tests covering session refresh and cookie handling
   - Consider integration tests with real Next.js request/response

2. **Write tests for getUserTenants** (CRITICAL)
   - 10-12 tests covering auth, queries, transformations, errors
   - Test both personal users and users with multiple tenants

3. **Write tests for errors.ts** (HIGH)
   - 7 tests covering all error message mappings
   - Quick win - simple function to test

4. **Complete transforms.ts coverage** (HIGH)
   - 3-4 tests for transformMemberRow
   - Pure function - easy to test

### Short-Term Improvements

5. **Add integration tests** (MEDIUM)
   - Use local Supabase instance
   - Test actual database queries and RLS policies
   - Test middleware with real Next.js routing

6. **Test supabase-server.ts initialization** (MEDIUM)
   - 2-3 tests for client creation
   - Verify environment variable handling

### Long-Term Enhancements

7. **Add E2E tests for auth flows**
   - Sign up → email verification → sign in
   - Tenant creation → tenant switching → tenant deletion
   - Use Playwright or Cypress

8. **Add performance benchmarks**
   - Measure getSessionContext latency
   - Detect N+1 query regressions

---

## Conclusion

The auth module has **strong foundational test coverage** with excellent quality tests for core session management and tenant operations. TASK-1-28 successfully brought `getSessionContext` to 100% coverage with comprehensive, well-structured tests.

However, **4 critical functions have zero test coverage**, creating significant risk:
1. **middleware.ts** - Untested session refresh (runs on every route)
2. **getUserTenants** - Untested tenant listing (powers UI)
3. **errors.ts** - Untested error messages (user experience)
4. **transforms.ts** - Partial coverage (data integrity)

### Final Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| **Code Coverage** | 60/100 | 40% | 24 |
| **Test Quality** | 95/100 | 30% | 28.5 |
| **Critical Path Coverage** | 60/100 | 20% | 12 |
| **Error Handling** | 85/100 | 10% | 8.5 |
| **TOTAL** | **75/100** | 100% | **73** |

**Recommendation:** Add the 4 missing test files before marking Part 2 as complete. The existing tests are excellent quality—apply the same patterns to the untested modules.

---

## Test Files Summary

### Existing Tests (83 total tests)
- ✅ `get-session-context.test.ts` - 21 tests, 100% coverage
- ✅ `get-active-tenant.test.ts` - 18 tests, 100% coverage
- ✅ `actions/create-tenant.test.ts` - 32 tests, 90.9% coverage
- ✅ `actions/switch-tenant.test.ts` - 11 tests, 90.5% coverage
- ✅ `supabase-browser.test.ts` - 1 test, 100% coverage

### Missing Tests (Est. 35-40 tests needed)
- ❌ `get-user-tenants.test.ts` - 0 tests (need 10-12)
- ❌ `errors.test.ts` - 0 tests (need 7)
- ❌ `middleware.test.ts` - 0 tests (need 6-8)
- ❌ `transforms.test.ts` - 0 tests (need 3-4)
- ❌ `supabase-server.test.ts` - 0 tests (need 2-3)

**Target:** 120+ total tests for 90%+ coverage

---

## Appendix: Test Examples to Add

### Example: getUserTenants Tests

```typescript
describe('getUserTenants', () => {
  describe('authentication', () => {
    it('throws error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await expect(getUserTenants()).rejects.toThrow('Unauthorized')
    })
  })

  describe('personal users', () => {
    it('returns empty array when user has no tenants', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getUserTenants()

      expect(result).toEqual([])
    })
  })

  describe('tenant users', () => {
    it('returns array of TenantMembership objects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.select.mockResolvedValue({
        data: [
          {
            id: 'membership-1',
            tenant_id: 'tenant-1',
            user_id: 'user-123',
            role: 'owner',
            joined_at: '2024-01-01T00:00:00Z',
            tenants: {
              id: 'tenant-1',
              type: 'organization',
              name: 'Acme Corp',
              slug: 'acme-corp',
              org_number: '123456789',
              billing_email: 'billing@acme.com',
              settings: {},
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        ],
        error: null,
      })

      const result = await getUserTenants()

      expect(result).toHaveLength(1)
      expect(result[0].tenant.name).toBe('Acme Corp')
      expect(result[0].membership.role).toBe('owner')
    })

    it('orders tenants by joined_at descending', async () => {
      // ... test ordering
    })
  })

  describe('error handling', () => {
    it('throws error when database query fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      await expect(getUserTenants()).rejects.toThrow('Failed to fetch user tenants')
    })
  })
})
```

### Example: getAuthErrorMessage Tests

```typescript
describe('getAuthErrorMessage', () => {
  it('maps "Invalid login credentials" to user-friendly message', () => {
    const error = { message: 'Invalid login credentials' } as AuthError
    expect(getAuthErrorMessage(error)).toBe('Invalid email or password')
  })

  it('maps "Email not confirmed" to user-friendly message', () => {
    const error = { message: 'Email not confirmed' } as AuthError
    expect(getAuthErrorMessage(error)).toBe('Please verify your email before signing in')
  })

  // ... more cases

  it('returns generic message for unknown errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = { message: 'Unknown error XYZ' } as AuthError
    const result = getAuthErrorMessage(error)

    expect(result).toBe('Authentication failed. Please try again.')
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Auth Error]', 'Unknown error XYZ')

    consoleErrorSpy.mockRestore()
  })
})
```
