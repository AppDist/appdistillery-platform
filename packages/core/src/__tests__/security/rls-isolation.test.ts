/**
 * RLS Tenant Isolation Tests
 *
 * Tests that Row Level Security policies properly isolate tenant data.
 * Verifies that users can only access data from tenants they belong to.
 *
 * Test Coverage:
 * - tenants table: users can only see their own tenants
 * - tenant_members table: users can only see their own memberships and tenant members
 * - usage_events table: users can only see tenant usage and personal usage
 *
 * @requires Local Supabase instance running (http://127.0.0.1:54321)
 * @skipIf SUPABASE_SECRET_KEY is not set (graceful skip)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createServiceClient,
  createAuthenticatedClient,
  createTestUser,
  createTestTenant,
  createTestUsageEvent,
  cleanupTestData,
  type TestContext,
} from './rls-test-helpers'
import { TEST_USERS, TEST_TENANTS, TEST_USAGE_EVENTS } from './fixtures'

// Skip tests if Supabase is not configured
const skipIfNoSupabase =
  !process.env.SUPABASE_SECRET_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL

describe.skipIf(skipIfNoSupabase)('RLS Tenant Isolation', () => {
  let context: TestContext

  beforeAll(async () => {
    const serviceClient = createServiceClient()

    // Create test users
    const userA = await createTestUser(
      serviceClient,
      TEST_USERS.userA.email,
      TEST_USERS.userA.password,
      TEST_USERS.userA.displayName
    )

    const userB = await createTestUser(
      serviceClient,
      TEST_USERS.userB.email,
      TEST_USERS.userB.password,
      TEST_USERS.userB.displayName
    )

    // Create authenticated clients
    const userAClient = createAuthenticatedClient(userA.accessToken)
    const userBClient = createAuthenticatedClient(userB.accessToken)

    // Create tenants (User A owns Tenant A, User B owns Tenant B)
    const tenantA = await createTestTenant(serviceClient, userA.id, {
      name: TEST_TENANTS.tenantA.name,
      slug: TEST_TENANTS.tenantA.slug,
      type: TEST_TENANTS.tenantA.type,
    })

    const tenantB = await createTestTenant(serviceClient, userB.id, {
      name: TEST_TENANTS.tenantB.name,
      slug: TEST_TENANTS.tenantB.slug,
      type: TEST_TENANTS.tenantB.type,
      orgNumber: TEST_TENANTS.tenantB.orgNumber,
      billingEmail: TEST_TENANTS.tenantB.billingEmail,
    })

    // Create usage events
    const tenantAEventId = await createTestUsageEvent(
      serviceClient,
      userA.id,
      tenantA.id,
      TEST_USAGE_EVENTS.tenantAEvent
    )

    const tenantBEventId = await createTestUsageEvent(
      serviceClient,
      userB.id,
      tenantB.id,
      TEST_USAGE_EVENTS.tenantBEvent
    )

    const personalUserAEventId = await createTestUsageEvent(
      serviceClient,
      userA.id,
      null,
      TEST_USAGE_EVENTS.personalEventUserA
    )

    const personalUserBEventId = await createTestUsageEvent(
      serviceClient,
      userB.id,
      null,
      TEST_USAGE_EVENTS.personalEventUserB
    )

    context = {
      serviceClient,
      userA,
      userB,
      userAClient,
      userBClient,
      tenantA,
      tenantB,
      usageEventIds: {
        tenantA: tenantAEventId,
        tenantB: tenantBEventId,
        personalUserA: personalUserAEventId,
        personalUserB: personalUserBEventId,
      },
    }
  }, 30000) // 30 second timeout for setup

  afterAll(async () => {
    if (context) {
      await cleanupTestData(context.serviceClient, context)
    }
  }, 30000) // 30 second timeout for cleanup

  describe('tenants table RLS', () => {
    it('User A can see Tenant A', async () => {
      const { data, error } = await context.userAClient
        .from('tenants')
        .select('*')
        .eq('id', context.tenantA.id)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.tenantA.id)
      expect(data?.name).toBe(TEST_TENANTS.tenantA.name)
      expect(data?.slug).toBe(TEST_TENANTS.tenantA.slug)
    })

    it('User A cannot see Tenant B', async () => {
      const { data, error } = await context.userAClient
        .from('tenants')
        .select('*')
        .eq('id', context.tenantB.id)
        .single()

      // Should return no rows or an error (depending on RLS implementation)
      // The key is that we don't get the data
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User B can see Tenant B', async () => {
      const { data, error } = await context.userBClient
        .from('tenants')
        .select('*')
        .eq('id', context.tenantB.id)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.tenantB.id)
      expect(data?.name).toBe(TEST_TENANTS.tenantB.name)
      expect(data?.slug).toBe(TEST_TENANTS.tenantB.slug)
    })

    it('User B cannot see Tenant A', async () => {
      const { data, error } = await context.userBClient
        .from('tenants')
        .select('*')
        .eq('id', context.tenantA.id)
        .single()

      // Should return no rows or an error
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User A sees only Tenant A when querying all tenants', async () => {
      const { data, error } = await context.userAClient
        .from('tenants')
        .select('*')

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      if (!data) throw new Error('Expected data to exist')
      expect(data).toHaveLength(1)
      expect(data[0]?.id).toBe(context.tenantA.id)
    })

    it('User B sees only Tenant B when querying all tenants', async () => {
      const { data, error } = await context.userBClient
        .from('tenants')
        .select('*')

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      if (!data) throw new Error('Expected data to exist')
      expect(data).toHaveLength(1)
      expect(data[0]?.id).toBe(context.tenantB.id)
    })
  })

  describe('tenant_members table RLS', () => {
    it('User A can see own membership in Tenant A', async () => {
      const { data, error } = await context.userAClient
        .from('tenant_members')
        .select('*')
        .eq('user_id', context.userA.id)
        .eq('tenant_id', context.tenantA.id)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.user_id).toBe(context.userA.id)
      expect(data?.tenant_id).toBe(context.tenantA.id)
      expect(data?.role).toBe('owner')
    })

    it('User A can see all members of Tenant A (as member of that tenant)', async () => {
      const { data, error } = await context.userAClient
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', context.tenantA.id)

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.length).toBeGreaterThan(0)
      expect(data?.some((m) => m.user_id === context.userA.id)).toBe(true)
    })

    it('User A cannot see members of Tenant B', async () => {
      const { data, error } = await context.userAClient
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', context.tenantB.id)

      // Should return empty array (no access)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('User A cannot see User B membership in Tenant B', async () => {
      const { data, error } = await context.userAClient
        .from('tenant_members')
        .select('*')
        .eq('user_id', context.userB.id)
        .eq('tenant_id', context.tenantB.id)

      // Should return no rows
      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('User B can see own membership in Tenant B', async () => {
      const { data, error } = await context.userBClient
        .from('tenant_members')
        .select('*')
        .eq('user_id', context.userB.id)
        .eq('tenant_id', context.tenantB.id)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.user_id).toBe(context.userB.id)
      expect(data?.tenant_id).toBe(context.tenantB.id)
      expect(data?.role).toBe('owner')
    })

    it('User B cannot see members of Tenant A', async () => {
      const { data, error } = await context.userBClient
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', context.tenantA.id)

      // Should return empty array (no access)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('usage_events table RLS', () => {
    it('User A can see Tenant A usage events', async () => {
      const { data, error } = await context.userAClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.tenantA)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.usageEventIds.tenantA)
      expect(data?.tenant_id).toBe(context.tenantA.id)
      expect(data?.user_id).toBe(context.userA.id)
    })

    it('User A cannot see Tenant B usage events', async () => {
      const { data, error } = await context.userAClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.tenantB)
        .single()

      // Should return no data
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User A can see own Personal mode events (tenant_id IS NULL)', async () => {
      const { data, error } = await context.userAClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.personalUserA)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.usageEventIds.personalUserA)
      expect(data?.tenant_id).toBeNull()
      expect(data?.user_id).toBe(context.userA.id)
    })

    it('User A cannot see User B Personal mode events', async () => {
      const { data, error } = await context.userAClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.personalUserB)
        .single()

      // Should return no data
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User B can see Tenant B usage events', async () => {
      const { data, error } = await context.userBClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.tenantB)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.usageEventIds.tenantB)
      expect(data?.tenant_id).toBe(context.tenantB.id)
      expect(data?.user_id).toBe(context.userB.id)
    })

    it('User B cannot see Tenant A usage events', async () => {
      const { data, error } = await context.userBClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.tenantA)
        .single()

      // Should return no data
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User B can see own Personal mode events', async () => {
      const { data, error } = await context.userBClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.personalUserB)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data?.id).toBe(context.usageEventIds.personalUserB)
      expect(data?.tenant_id).toBeNull()
      expect(data?.user_id).toBe(context.userB.id)
    })

    it('User B cannot see User A Personal mode events', async () => {
      const { data, error } = await context.userBClient
        .from('usage_events')
        .select('*')
        .eq('id', context.usageEventIds.personalUserA)
        .single()

      // Should return no data
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })

    it('User A sees only Tenant A and own Personal events when querying all', async () => {
      const { data, error } = await context.userAClient
        .from('usage_events')
        .select('*')
        .in('id', Object.values(context.usageEventIds))

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data).toHaveLength(2) // Tenant A event + Personal User A event
      expect(data?.some((e) => e.id === context.usageEventIds.tenantA)).toBe(
        true
      )
      expect(
        data?.some((e) => e.id === context.usageEventIds.personalUserA)
      ).toBe(true)
      expect(data?.some((e) => e.id === context.usageEventIds.tenantB)).toBe(
        false
      )
      expect(
        data?.some((e) => e.id === context.usageEventIds.personalUserB)
      ).toBe(false)
    })

    it('User B sees only Tenant B and own Personal events when querying all', async () => {
      const { data, error } = await context.userBClient
        .from('usage_events')
        .select('*')
        .in('id', Object.values(context.usageEventIds))

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data).toHaveLength(2) // Tenant B event + Personal User B event
      expect(data?.some((e) => e.id === context.usageEventIds.tenantB)).toBe(
        true
      )
      expect(
        data?.some((e) => e.id === context.usageEventIds.personalUserB)
      ).toBe(true)
      expect(data?.some((e) => e.id === context.usageEventIds.tenantA)).toBe(
        false
      )
      expect(
        data?.some((e) => e.id === context.usageEventIds.personalUserA)
      ).toBe(false)
    })
  })
})

/**
 * PATTERN DOCUMENTATION: Adding New Table Tests
 *
 * To add RLS isolation tests for a new table, follow this pattern:
 *
 * 1. Add test data to fixtures.ts:
 *    export const TEST_NEW_TABLE = {
 *      recordA: { ... },
 *      recordB: { ... },
 *    } as const
 *
 * 2. Add helper function to setup.ts:
 *    export async function createTestRecord(
 *      serviceClient: SupabaseClient<Database>,
 *      userId: string,
 *      tenantId: string | null,
 *      recordData: { ... }
 *    ): Promise<string> { ... }
 *
 * 3. Update TestContext in setup.ts to include new record IDs:
 *    export interface TestContext {
 *      ...
 *      newTableRecordIds: { recordA: string; recordB: string }
 *    }
 *
 * 4. Create records in beforeAll:
 *    const recordA = await createTestRecord(...)
 *    const recordB = await createTestRecord(...)
 *
 * 5. Add cleanup in cleanupTestData:
 *    await serviceClient.from('new_table').delete().in('id', [...])
 *
 * 6. Add test suite following the pattern:
 *    describe('new_table RLS', () => {
 *      it('User A can see own tenant data', async () => { ... })
 *      it('User A cannot see other tenant data', async () => { ... })
 *      ...
 *    })
 *
 * Key Testing Points for Each Table:
 * - Positive: User can see own tenant data
 * - Negative: User cannot see other tenant data
 * - List: User sees only own tenant data when querying all
 * - Personal mode (if applicable): User can see own personal data
 * - Personal isolation (if applicable): User cannot see other's personal data
 */
