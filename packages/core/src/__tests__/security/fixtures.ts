/**
 * Test fixtures for RLS isolation tests
 * Contains constants and test data for tenant isolation testing
 */

/**
 * Local Supabase configuration
 * These are the standard keys for local Supabase development
 * Safe to commit - only work for local instances
 */
export const LOCAL_SUPABASE = {
  url: 'http://127.0.0.1:54321',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRoleKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
} as const

// Generate unique emails with timestamp to avoid conflicts between test runs
const timestamp = Date.now()

export const TEST_USERS = {
  userA: {
    email: `user-a-${timestamp}@rls-test.example.com`,
    password: 'test-password-user-a-secure',
    displayName: 'User A',
  },
  userB: {
    email: `user-b-${timestamp}@rls-test.example.com`,
    password: 'test-password-user-b-secure',
    displayName: 'User B',
  },
} as const

export const TEST_TENANTS = {
  tenantA: {
    name: 'Test Tenant A',
    slug: `test-tenant-a-${timestamp}`,
    type: 'household' as const,
  },
  tenantB: {
    name: 'Test Tenant B',
    slug: `test-tenant-b-${timestamp}`,
    type: 'organization' as const,
    orgNumber: '123456789',
    billingEmail: 'billing@tenant-b.example.com',
  },
} as const

export const TEST_USAGE_EVENTS = {
  tenantAEvent: {
    action: 'test:isolation:verify',
    moduleId: 'test',
    tokensInput: 100,
    tokensOutput: 50,
    units: 10,
    metadata: { test: 'tenant-a-event' },
  },
  tenantBEvent: {
    action: 'test:isolation:verify',
    moduleId: 'test',
    tokensInput: 200,
    tokensOutput: 100,
    units: 20,
    metadata: { test: 'tenant-b-event' },
  },
  personalEventUserA: {
    action: 'test:personal:mode',
    moduleId: 'test',
    tokensInput: 50,
    tokensOutput: 25,
    units: 5,
    metadata: { test: 'personal-user-a' },
  },
  personalEventUserB: {
    action: 'test:personal:mode',
    moduleId: 'test',
    tokensInput: 75,
    tokensOutput: 30,
    units: 7,
    metadata: { test: 'personal-user-b' },
  },
} as const
