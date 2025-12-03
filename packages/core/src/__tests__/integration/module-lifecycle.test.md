# Module Lifecycle Integration Tests

## Overview

Comprehensive integration tests for the complete module lifecycle in the AppDistillery Platform.

## File Location

`/Users/matshagen/Documents/Projects/appdistillery-platform/packages/core/src/__tests__/integration/module-lifecycle.test.ts`

## Test Coverage

### 1. Module Installation (3 tests)
- ✅ Installs module with custom settings
- ✅ Verifies tenant_modules record exists with enabled=true
- ✅ Verifies settings are persisted correctly

**What it tests:**
- `installModule()` Server Action creates tenant_modules record
- Settings stored as JSON in database
- Tenant isolation (tenant_id included)
- Module enabled by default

### 2. Module Disable - Soft Delete (3 tests)
- ✅ Disables module via soft delete
- ✅ Verifies tenant_modules record has enabled=false
- ✅ Verifies settings preserved after soft delete

**What it tests:**
- `uninstallModule({ hardDelete: false })` sets enabled=false
- Record remains in database
- Settings remain intact

### 3. Module Re-enable (3 tests)
- ✅ Re-enables module via installModule
- ✅ Verifies module is enabled after re-install
- ✅ Verifies settings updated after re-enable

**What it tests:**
- `installModule()` detects disabled module and re-enables it
- enabled=true after re-enable
- Settings can be updated during re-enable

### 4. Module Hard Delete (3 tests)
- ✅ Hard deletes module
- ✅ Verifies tenant_modules record removed
- ✅ Verifies module no longer appears in tenant modules list

**What it tests:**
- `uninstallModule({ hardDelete: true })` removes record
- No tenant_modules record remains
- Complete removal from tenant's module list

### 5. Settings Persistence Across Lifecycle (1 test)
- ✅ Completes full lifecycle with settings preservation

**Full lifecycle flow:**
1. Install with initial settings → verify settings
2. Soft delete → verify settings preserved
3. Re-enable with new settings → verify settings updated
4. Hard delete → cleanup

### 6. Error Handling (4 tests)
- ✅ Returns error when installing already installed module
- ✅ Returns error when uninstalling non-existent module
- ✅ Returns error when soft deleting already disabled module
- ✅ Returns error when installing inactive module

**Edge cases tested:**
- Duplicate installation prevention
- Non-existent module handling
- Double soft-delete prevention
- Inactive module validation

### 7. Tenant Isolation (2 tests)
- ✅ Verifies tenant isolation in module operations
- ✅ Prevents access to modules from other tenants

**Security validation:**
- tenant_id always included in operations
- Modules scoped to specific tenant
- Cross-tenant access prevention

## Total Test Count

**19 test cases** covering all lifecycle stages and edge cases.

## Test Structure

### Test Lifecycle Hooks

```typescript
beforeAll(async () => {
  // Create service client
  // Create test user
  // Create test tenant
  // Create test module in database
})

afterAll(async () => {
  // Clean up tenant_modules
  // Delete test module
  // Clean up user and tenant
})

beforeEach(() => {
  // Reset tenantModuleId tracker
})
```

### Mock Strategy

No mocking - full integration tests using:
- Real Supabase database operations
- Real Server Actions (installModule, uninstallModule)
- Service role client for setup/cleanup
- User session context for Server Action calls

### Test Data

- **Test Module ID**: `test-module-{timestamp}`
- **Test User**: `module-lifecycle-{timestamp}@integration-test.example.com`
- **Test Tenant**: `Module Lifecycle Test {timestamp}`
- **Settings Examples**:
  - `{ featureFlags: { proposals: true, briefs: true }, theme: 'dark', maxUsers: 10 }`
  - `{ feature: 'enabled', color: 'blue', count: 5 }`

## Running the Tests

### Prerequisites

1. Local Supabase running via Docker
2. Environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

### Commands

```bash
# Run all integration tests
pnpm --filter @appdistillery/core test integration

# Run only module lifecycle tests
pnpm --filter @appdistillery/core test module-lifecycle

# Run with coverage
pnpm --filter @appdistillery/core test module-lifecycle --coverage
```

### Skip Behavior

Tests automatically skip if Supabase is not available:
```typescript
const skipIfNoSupabase =
  !process.env.SUPABASE_SECRET_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(skipIfNoSupabase)('Module Lifecycle Integration', () => {
  // Tests...
});
```

## Test Patterns Used

### AAA Pattern (Arrange-Act-Assert)

Every test follows this structure:
```typescript
it('test name', async () => {
  // ARRANGE: Setup test data
  const input = { moduleId, settings: {} };

  // ACT: Perform action
  const result = await installModule(input);

  // ASSERT: Verify outcome
  expect(result.success).toBe(true);
});
```

### Result Type Narrowing

Using TypeScript discriminated unions:
```typescript
const result = await installModule(input);

expect(result.success).toBe(true);
if (result.success) {
  // TypeScript knows result.data exists here
  expect(result.data.id).toBeTruthy();
}
```

### Database Verification

After Server Action calls, verify database state:
```typescript
const result = await installModule(input);

const { data: tenantModule } = await context.serviceClient
  .from('tenant_modules')
  .select('*')
  .eq('id', result.data.id)
  .single();

expect(tenantModule?.enabled).toBe(true);
```

## Test Quality Checklist

- [x] Tests describe behavior, not implementation
- [x] Each test tests ONE thing
- [x] Tests are independent (no shared state between tests)
- [x] Full integration - no mocking of Server Actions
- [x] Error cases tested
- [x] Edge cases covered (duplicate install, double soft-delete)
- [x] Tenant isolation verified
- [x] Settings persistence validated
- [x] Cleanup in afterAll hook

## Related Files

### Implementation
- `/packages/core/src/modules/actions/install-module.ts` - Install action
- `/packages/core/src/modules/actions/uninstall-module.ts` - Uninstall action

### Other Tests
- `/packages/core/src/modules/actions/install-module.test.ts` - Unit tests
- `/packages/core/src/modules/actions/uninstall-module.test.ts` - Unit tests
- `/packages/core/src/__tests__/integration/core-kernel.test.ts` - Core kernel integration tests

### Setup Utilities
- `/packages/core/src/__tests__/integration/setup.ts` - Integration test helpers

## Integration Test vs Unit Test

**Unit Tests** (install-module.test.ts):
- Mock Supabase client
- Mock getSessionContext
- Test business logic in isolation
- Fast execution

**Integration Tests** (module-lifecycle.test.ts):
- Real Supabase database
- Real Server Actions
- Test full user journey
- Slower execution, comprehensive validation

## Known Limitations

1. **Requires Docker**: Tests need local Supabase running
2. **Sequential Execution**: Tests run sequentially due to shared test module
3. **Cleanup Dependencies**: Must clean up in correct order (modules → tenants → users)

## Future Enhancements

Potential additions:
- [ ] Test module cascade deletes (module data cleanup on hard delete)
- [ ] Test module permissions (non-admin users)
- [ ] Test concurrent module operations
- [ ] Test module migration scenarios
- [ ] Performance benchmarks for lifecycle operations
