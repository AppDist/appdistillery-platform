/**
 * Integration test setup helpers
 * Provides utilities for creating test users, tenants, and cleaning up test data
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@appdistillery/database';
import { LOCAL_SUPABASE } from '../security/fixtures';

export interface IntegrationTestUser {
  id: string;
  email: string;
  accessToken: string;
}

export interface IntegrationTestTenant {
  id: string;
  name: string;
  slug: string;
  type: 'household' | 'organization';
}

export interface IntegrationTestContext {
  serviceClient: SupabaseClient<Database>;
  user: IntegrationTestUser;
  tenant: IntegrationTestTenant;
  usageEventIds: string[];
}

/**
 * Creates a Supabase service client for admin operations
 */
export function createIntegrationServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE.url;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || LOCAL_SUPABASE.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a test user via admin API and returns user details with access token
 */
export async function createIntegrationTestUser(
  serviceClient: SupabaseClient<Database>,
  emailPrefix: string = 'integration'
): Promise<IntegrationTestUser> {
  const timestamp = Date.now();
  const email = `${emailPrefix}-${timestamp}@integration-test.example.com`;
  const password = `test-password-${timestamp}-secure`;

  // Create user via admin API
  const { data: userData, error: userError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: `Integration Test User ${timestamp}`,
      },
    });

  if (userError || !userData.user) {
    throw new Error(`Failed to create user ${email}: ${userError?.message}`);
  }

  // Sign in to get access token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE.url;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || LOCAL_SUPABASE.anonKey;

  const anonClient = createClient<Database>(supabaseUrl, anonKey);

  const { data: sessionData, error: sessionError } =
    await anonClient.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError || !sessionData.session) {
    throw new Error(
      `Failed to sign in as ${email}: ${sessionError?.message}`
    );
  }

  return {
    id: userData.user.id,
    email: userData.user.email!,
    accessToken: sessionData.session.access_token,
  };
}

/**
 * Creates a test tenant with the specified user as owner
 */
export async function createIntegrationTestTenant(
  serviceClient: SupabaseClient<Database>,
  userId: string,
  namePrefix: string = 'Integration Test Tenant'
): Promise<IntegrationTestTenant> {
  const timestamp = Date.now();
  const name = `${namePrefix} ${timestamp}`;
  const slug = `integration-test-${timestamp}`;

  // Create the tenant using service role (bypasses RLS)
  const { data: tenant, error: tenantError } = await serviceClient
    .from('tenants')
    .insert({
      type: 'organization',
      name,
      slug,
      org_number: null,
      billing_email: null,
    })
    .select('id')
    .single();

  if (tenantError || !tenant) {
    throw new Error(
      `Failed to create tenant ${name}: ${tenantError?.message}`
    );
  }

  // Create the membership (owner)
  const { error: membershipError } = await serviceClient
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
    });

  if (membershipError) {
    throw new Error(
      `Failed to create membership for tenant ${name}: ${membershipError.message}`
    );
  }

  return {
    id: tenant.id,
    name,
    slug,
    type: 'organization',
  };
}

/**
 * Cleanup function to remove all test data in the correct order
 */
export async function cleanupIntegrationTestData(
  serviceClient: SupabaseClient<Database>,
  context: Partial<IntegrationTestContext>
): Promise<void> {
  try {
    // Delete usage events
    if (context.usageEventIds && context.usageEventIds.length > 0) {
      await serviceClient
        .from('usage_events')
        .delete()
        .in('id', context.usageEventIds);
    }

    // Delete by tenant_id if we have a tenant
    if (context.tenant?.id) {
      await serviceClient
        .from('usage_events')
        .delete()
        .eq('tenant_id', context.tenant.id);
    }

    // Delete by user_id if we have a user
    if (context.user?.id) {
      await serviceClient
        .from('usage_events')
        .delete()
        .eq('user_id', context.user.id);
    }

    // Delete tenant memberships
    if (context.tenant?.id) {
      await serviceClient
        .from('tenant_members')
        .delete()
        .eq('tenant_id', context.tenant.id);
    }

    // Delete tenant
    if (context.tenant?.id) {
      await serviceClient.from('tenants').delete().eq('id', context.tenant.id);
    }

    // Delete user (this will cascade delete user_profiles)
    if (context.user?.id) {
      await serviceClient.auth.admin.deleteUser(context.user.id);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw - cleanup should be best-effort
  }
}
