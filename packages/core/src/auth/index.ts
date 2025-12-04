import { createServerSupabaseClient } from './supabase-server'
import { getUserTenants } from './get-user-tenants'
import { getActiveTenant } from './get-active-tenant'
import { getAuthenticatedUserId, fetchUserProfile, fetchTenantMembership } from './helpers'
import type {
  UserProfile,
  Tenant,
  TenantMember,
  TenantMemberRow,
} from './types'
import { logger } from '../utils/logger'
import { getCachedSession, setCachedSession } from './session-cache'

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
  // Validate JWT with auth server (getUser() not getSession())
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return null
  }

  // Check cache first
  const cached = getCachedSession(userId)
  if (cached) {
    return cached
  }

  // Fetch user profile from database
  const { profile: userProfile, error: profileError } = await fetchUserProfile(userId)
  if (!userProfile) {
    logger.error('getSessionContext', 'Failed to fetch user profile', { error: profileError });
    return null
  }

  // Get active tenant from cookie (user's selected tenant)
  // Pass userId to avoid redundant getUser() call
  try {
    const activeTenant = await getActiveTenant(userId)

    // If no active tenant, user is working in personal mode
    if (!activeTenant) {
      const session = {
        user: userProfile,
        tenant: null,
        membership: null,
      }
      setCachedSession(userId, session)
      return session
    }

    // Fetch user's membership details for the active tenant
    const { membership, error: membershipError } = await fetchTenantMembership(userId, activeTenant.id)

    if (!membership) {
      logger.error('getSessionContext', 'Failed to fetch membership', { error: membershipError });
      // Fallback to personal user mode if membership fetch fails
      const session = {
        user: userProfile,
        tenant: null,
        membership: null,
      }
      setCachedSession(userId, session)
      return session
    }

    const session = {
      user: userProfile,
      tenant: activeTenant,
      membership,
    }
    setCachedSession(userId, session)
    return session
  } catch (error) {
    logger.error('getSessionContext', 'Failed to get active tenant', { error });
    // Fallback to personal user mode if tenant fetch fails
    const session = {
      user: userProfile,
      tenant: null,
      membership: null,
    }
    setCachedSession(userId, session)
    return session
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

// Export session cache utilities
export { invalidateSession, invalidateAllSessions } from './session-cache'

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
