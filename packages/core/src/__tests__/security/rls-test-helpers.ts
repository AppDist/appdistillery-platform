/**
 * Test setup helpers for RLS isolation tests
 * Provides utilities for creating test users, tenants, and authenticated clients
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@appdistillery/database'
import { LOCAL_SUPABASE } from './fixtures'

export interface TestUser {
  id: string
  email: string
  accessToken: string
}

export interface TestTenant {
  id: string
  name: string
  slug: string
  type: 'household' | 'organization'
}

export interface TestContext {
  serviceClient: SupabaseClient<Database>
  userA: TestUser
  userB: TestUser
  userAClient: SupabaseClient<Database>
  userBClient: SupabaseClient<Database>
  tenantA: TestTenant
  tenantB: TestTenant
  usageEventIds: {
    tenantA: string
    tenantB: string
    personalUserA: string
    personalUserB: string
  }
  tenantModuleIds: {
    tenantA: string
    tenantB: string
  }
}

/**
 * Creates a Supabase service client for admin operations
 */
export function createServiceClient(): SupabaseClient<Database> {
  // Use local Supabase instance for testing (fallback to env vars for flexibility)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE.url
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || LOCAL_SUPABASE.serviceRoleKey

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Creates an authenticated Supabase client for a specific user
 */
export function createAuthenticatedClient(
  accessToken: string
): SupabaseClient<Database> {
  // Use local Supabase instance for testing (fallback to env vars for flexibility)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE.url
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || LOCAL_SUPABASE.anonKey

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    )
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

/**
 * Creates a test user and returns user details with access token
 */
export async function createTestUser(
  serviceClient: SupabaseClient<Database>,
  email: string,
  password: string,
  displayName: string
): Promise<TestUser> {
  // Create user via admin API
  const { data: userData, error: userError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    })

  if (userError || !userData.user) {
    throw new Error(`Failed to create user ${email}: ${userError?.message}`)
  }

  // Sign in to get access token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE.url
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || LOCAL_SUPABASE.anonKey

  const anonClient = createClient<Database>(supabaseUrl, anonKey)

  const { data: sessionData, error: sessionError } =
    await anonClient.auth.signInWithPassword({
      email,
      password,
    })

  if (sessionError || !sessionData.session) {
    throw new Error(
      `Failed to sign in as ${email}: ${sessionError?.message}`
    )
  }

  return {
    id: userData.user.id,
    email: userData.user.email!,
    accessToken: sessionData.session.access_token,
  }
}

/**
 * Creates a test tenant with the specified user as owner
 */
export async function createTestTenant(
  serviceClient: SupabaseClient<Database>,
  userId: string,
  tenantData: {
    name: string
    slug: string
    type: 'household' | 'organization'
    orgNumber?: string
    billingEmail?: string
  }
): Promise<TestTenant> {
  // Since we're using service_role client, we can't use create_tenant_with_owner
  // (it requires auth.uid()). Instead, insert directly using service_role bypass.

  // Create the tenant
  const { data: tenant, error: tenantError } = await serviceClient
    .from('tenants')
    .insert({
      type: tenantData.type,
      name: tenantData.name,
      slug: tenantData.slug,
      org_number: tenantData.orgNumber ?? null,
      billing_email: tenantData.billingEmail ?? null,
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    throw new Error(
      `Failed to create tenant ${tenantData.name}: ${tenantError?.message}`
    )
  }

  // Create the membership
  const { error: membershipError } = await serviceClient
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
    })

  if (membershipError) {
    throw new Error(
      `Failed to create membership for tenant ${tenantData.name}: ${membershipError.message}`
    )
  }

  return {
    id: tenant.id,
    name: tenantData.name,
    slug: tenantData.slug,
    type: tenantData.type,
  }
}

/**
 * Creates a usage event for testing
 */
export async function createTestUsageEvent(
  serviceClient: SupabaseClient<Database>,
  userId: string,
  tenantId: string | null,
  eventData: {
    action: string
    moduleId: string
    tokensInput: number
    tokensOutput: number
    units: number
    metadata: Record<string, unknown>
  }
): Promise<string> {
  const { data, error } = await serviceClient
    .from('usage_events')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      action: eventData.action,
      module_id: eventData.moduleId,
      tokens_input: eventData.tokensInput,
      tokens_output: eventData.tokensOutput,
      units: eventData.units,
      metadata: eventData.metadata as Database['public']['Tables']['usage_events']['Insert']['metadata'],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create usage event: ${error?.message}`)
  }

  return data.id
}

/**
 * Creates a tenant_modules record for testing
 */
export async function createTestTenantModule(
  serviceClient: SupabaseClient<Database>,
  tenantId: string,
  moduleData: {
    moduleId: string
    enabled: boolean
    settings: Record<string, unknown>
  }
): Promise<string> {
  const { data, error } = await serviceClient
    .from('tenant_modules')
    .insert({
      tenant_id: tenantId,
      module_id: moduleData.moduleId,
      enabled: moduleData.enabled,
      settings: moduleData.settings as Database['public']['Tables']['tenant_modules']['Insert']['settings'],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create tenant module: ${error?.message}`)
  }

  return data.id
}

/**
 * Cleanup function to remove all test data in the correct order
 */
export async function cleanupTestData(
  serviceClient: SupabaseClient<Database>,
  context: Partial<TestContext>
): Promise<void> {
  try {
    // Delete usage events
    if (context.usageEventIds) {
      await serviceClient
        .from('usage_events')
        .delete()
        .in('id', Object.values(context.usageEventIds))
    }

    // Delete tenant_modules
    if (context.tenantModuleIds) {
      await serviceClient
        .from('tenant_modules')
        .delete()
        .in('id', Object.values(context.tenantModuleIds))
    }

    // Delete tenant memberships
    if (context.tenantA || context.tenantB) {
      const tenantIds = [context.tenantA?.id, context.tenantB?.id].filter(
        Boolean
      ) as string[]
      if (tenantIds.length > 0) {
        await serviceClient
          .from('tenant_members')
          .delete()
          .in('tenant_id', tenantIds)
      }
    }

    // Delete tenants
    if (context.tenantA || context.tenantB) {
      const tenantIds = [context.tenantA?.id, context.tenantB?.id].filter(
        Boolean
      ) as string[]
      if (tenantIds.length > 0) {
        await serviceClient.from('tenants').delete().in('id', tenantIds)
      }
    }

    // Delete users (this will cascade delete user_profiles)
    if (context.userA || context.userB) {
      const userIds = [context.userA?.id, context.userB?.id].filter(
        Boolean
      ) as string[]
      for (const userId of userIds) {
        await serviceClient.auth.admin.deleteUser(userId)
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
    // Don't throw - cleanup should be best-effort
  }
}
