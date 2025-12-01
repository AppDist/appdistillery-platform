import { createServerSupabaseClient } from './supabase-server'
import { getUserTenants } from './get-user-tenants'
import type {
  UserProfile,
  Tenant,
  TenantMember,
  UserProfileRow,
} from './types'

/**
 * Session context for authenticated requests
 *
 * Contains the authenticated user's profile, their current tenant (if any),
 * and their membership details within that tenant.
 *
 * - Personal users: tenant and membership will be null
 * - Tenant users: tenant and membership will be populated with first tenant
 *
 * Note: Multi-tenant switching will be implemented in Phase 2
 */
export interface SessionContext {
  user: UserProfile
  tenant: Tenant | null
  membership: TenantMember | null
}

/**
 * Get the current session context for the authenticated user
 *
 * Fetches the user's profile and their primary tenant (first tenant by join date).
 * Personal users (no tenant memberships) will have tenant = null.
 *
 * @returns SessionContext if authenticated, null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await getSessionContext()
 * if (!session) {
 *   throw new Error('Unauthorized')
 * }
 *
 * // Personal user
 * if (!session.tenant) {
 *   console.log('Working as personal user')
 * }
 *
 * // Tenant user
 * if (session.tenant) {
 *   console.log(`Working in tenant: ${session.tenant.name}`)
 *   console.log(`Role: ${session.membership.role}`)
 * }
 * ```
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabaseClient()

  // Validate JWT with auth server (getUser() not getSession())
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Fetch user profile from database
  const { data: profileRow, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profileRow) {
    console.error('[getSessionContext] Failed to fetch user profile:', profileError)
    return null
  }

  // Transform profile row to camelCase
  // Using 'as any' temporarily until database types are generated
  const rawProfile = profileRow as any
  const userProfile: UserProfile = {
    id: rawProfile.id,
    displayName: rawProfile.display_name,
    email: rawProfile.email,
    avatarUrl: rawProfile.avatar_url,
    createdAt: new Date(rawProfile.created_at),
    updatedAt: new Date(rawProfile.updated_at),
  }

  // Fetch user's tenants (if any)
  try {
    const tenants = await getUserTenants()

    // If user has no tenants, they work as a personal user
    if (tenants.length === 0) {
      return {
        user: userProfile,
        tenant: null,
        membership: null,
      }
    }

    // Use first tenant as primary (sorted by joined_at DESC)
    const primary = tenants[0]

    if (!primary) {
      // Fallback if no valid tenant found
      return {
        user: userProfile,
        tenant: null,
        membership: null,
      }
    }

    return {
      user: userProfile,
      tenant: primary.tenant,
      membership: primary.membership,
    }
  } catch (error) {
    console.error('[getSessionContext] Failed to fetch tenants:', error)
    // Fallback to personal user mode if tenant fetch fails
    return {
      user: userProfile,
      tenant: null,
      membership: null,
    }
  }
}

// Export Supabase client utilities
export { createBrowserSupabaseClient } from './supabase-browser'
export { createServerSupabaseClient } from './supabase-server'
export { updateSession } from './middleware'

// Export auth error handling
export { getAuthErrorMessage } from './errors'

// Export tenant utilities
export { getUserTenants } from './get-user-tenants'

// Export tenant creation actions
export { createHousehold, createOrganization } from './actions/create-tenant'

// Export tenant schemas
export {
  CreateHouseholdSchema,
  CreateOrganizationSchema,
  type CreateHouseholdInput,
  type CreateOrganizationInput,
} from './schemas/tenant'

// Export types
export type {
  TenantType,
  MemberRole,
  UserProfile,
  Tenant,
  TenantMember,
  TenantMembership,
} from './types'
