import { createServerSupabaseClient } from './supabase-server'
import { getUserTenants } from './get-user-tenants'
import { getActiveTenant } from './get-active-tenant'
import type {
  UserProfile,
  Tenant,
  TenantMember,
  UserProfileRow,
} from './types'

/**
 * Session context for authenticated requests
 *
 * Contains the authenticated user's profile, their active tenant (if any),
 * and their membership details within that tenant.
 *
 * The active tenant is determined by the `active_tenant_id` cookie, which
 * is set via the `switchTenant()` action.
 *
 * - Personal users: tenant and membership will be null (no active_tenant_id cookie)
 * - Tenant users: tenant and membership will be populated with the active tenant
 */
export interface SessionContext {
  user: UserProfile
  tenant: Tenant | null
  membership: TenantMember | null
}

/**
 * Get the current session context for the authenticated user
 *
 * Fetches the user's profile and their active tenant (from active_tenant_id cookie).
 * Personal users (no active tenant) will have tenant = null.
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
 * // Personal user (no active tenant)
 * if (!session.tenant) {
 *   console.log('Working as personal user')
 * }
 *
 * // Tenant user (active tenant selected)
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

  // Get active tenant from cookie (user's selected tenant)
  try {
    const activeTenant = await getActiveTenant()

    // If no active tenant, user is working in personal mode
    if (!activeTenant) {
      return {
        user: userProfile,
        tenant: null,
        membership: null,
      }
    }

    // Fetch user's membership details for the active tenant
    const { data: membershipRow, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id, tenant_id, user_id, role, joined_at')
      .eq('user_id', user.id)
      .eq('tenant_id', activeTenant.id)
      .single()

    if (membershipError || !membershipRow) {
      console.error('[getSessionContext] Failed to fetch membership:', membershipError)
      // Fallback to personal user mode if membership fetch fails
      return {
        user: userProfile,
        tenant: null,
        membership: null,
      }
    }

    // Transform membership row to camelCase
    const rawMembership = membershipRow as any
    const membership: TenantMember = {
      id: rawMembership.id,
      tenantId: rawMembership.tenant_id,
      userId: rawMembership.user_id,
      role: rawMembership.role,
      joinedAt: new Date(rawMembership.joined_at),
    }

    return {
      user: userProfile,
      tenant: activeTenant,
      membership,
    }
  } catch (error) {
    console.error('[getSessionContext] Failed to get active tenant:', error)
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
export { getActiveTenant } from './get-active-tenant'

// Export tenant creation actions
export { createHousehold, createOrganization } from './actions/create-tenant'

// Export tenant switching actions
export { switchTenant } from './actions/switch-tenant'

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
