import { createServerSupabaseClient } from './supabase-server'
import { transformMemberRow, transformTenantRow } from './transforms'
import type {
  UserProfile,
  UserProfileRow,
  TenantMember,
  TenantMemberRow,
  Tenant,
  TenantRow,
  TenantType
} from './types'
import { logger } from '../utils/logger';

/**
 * Transform snake_case user profile row to camelCase UserProfile object
 *
 * Converts Postgres snake_case column names to TypeScript camelCase
 * properties and transforms string dates to Date objects.
 *
 * @param row - Raw database row from user_profiles table
 * @returns UserProfile object with camelCase properties
 */
export function transformUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Fetch and transform user profile from database
 *
 * @param userId - User ID to fetch profile for
 * @returns Object with profile and error
 */
export async function fetchUserProfile(
  userId: string
): Promise<{ profile: UserProfile | null; error: Error | null }> {
  const supabase = await createServerSupabaseClient()

  const { data: profileRow, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profileRow) {
    return { profile: null, error: profileError as Error | null }
  }

  return {
    profile: transformUserProfileRow(profileRow as unknown as UserProfileRow),
    error: null
  }
}

/**
 * Check authentication and return user ID
 *
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  return user.id
}

/**
 * Check if a tenant slug is already taken
 *
 * @param slug - Slug to check
 * @returns True if slug exists, false otherwise
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  return !!existing
}

/**
 * Fetch tenant membership for a user
 *
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Object with membership and error
 */
export async function fetchTenantMembership(
  userId: string,
  tenantId: string
): Promise<{ membership: TenantMember | null; error: Error | null }> {
  const supabase = await createServerSupabaseClient()

  const { data: membershipRow, error: membershipError } = await supabase
    .from('tenant_members')
    .select('id, tenant_id, user_id, role, joined_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()

  if (membershipError || !membershipRow) {
    return { membership: null, error: membershipError as Error | null }
  }

  return {
    membership: transformMemberRow(membershipRow as unknown as TenantMemberRow),
    error: null
  }
}

/**
 * Call RPC to create tenant with owner atomically
 *
 * @param type - Tenant type (household or organization)
 * @param name - Tenant name
 * @param slug - Tenant slug
 * @param orgNumber - Optional organization number
 * @param billingEmail - Optional billing email
 * @returns Tenant ID or null on error
 */
export async function createTenantWithOwner(
  type: TenantType,
  name: string,
  slug: string,
  orgNumber?: string,
  billingEmail?: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.rpc('create_tenant_with_owner', {
    p_type: type,
    p_name: name,
    p_slug: slug,
    ...(orgNumber && { p_org_number: orgNumber }),
    ...(billingEmail && { p_billing_email: billingEmail }),
  } as any)

  if (error) {
    logger.error('createTenantWithOwner', 'Database error', { error });
    return null
  }

  return data
}

/**
 * Fetch tenant by ID
 *
 * @param tenantId - Tenant ID
 * @returns Tenant or null if not found
 */
export async function fetchTenant(tenantId: string): Promise<Tenant | null> {
  const supabase = await createServerSupabaseClient()

  const { data: tenantRow, error: fetchError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (fetchError || !tenantRow) {
    logger.error('fetchTenant', 'Fetch error', { error: fetchError });
    return null
  }

  return transformTenantRow(tenantRow as unknown as TenantRow)
}
