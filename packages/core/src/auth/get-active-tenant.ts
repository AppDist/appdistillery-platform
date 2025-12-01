import { cookies } from 'next/headers'
import { createServerSupabaseClient } from './supabase-server'
import type { Tenant, TenantRow } from './types'
import { ACTIVE_TENANT_COOKIE } from './constants'
import { transformTenantRow } from './transforms'

/**
 * Get the active tenant from cookies
 *
 * Reads the active_tenant_id cookie and fetches the full tenant data
 * from the database. Validates that the authenticated user is still
 * a member of the tenant (defensive check).
 *
 * Returns null if:
 * - Cookie is not set (user hasn't selected a tenant)
 * - Cookie is empty string (user selected personal mode)
 * - Tenant doesn't exist
 * - User is no longer a member of the tenant
 * - User is not authenticated
 *
 * @returns Tenant object if active tenant is set and valid, null otherwise
 *
 * @example
 * ```typescript
 * const activeTenant = await getActiveTenant()
 *
 * if (activeTenant) {
 *   console.log(`Working in: ${activeTenant.name}`)
 * } else {
 *   console.log('Working in personal mode')
 * }
 * ```
 */
export async function getActiveTenant(): Promise<Tenant | null> {
  try {
    // 1. Read cookie
    const cookieStore = await cookies()
    const tenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value

    // 2. If cookie is not set or empty, user is in personal mode
    if (!tenantId || tenantId === '') {
      return null
    }

    // 3. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[getActiveTenant] User not authenticated')
      return null
    }

    // 4. Validate user still has membership (defensive check)
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    if (membershipError || !membership) {
      console.warn(
        '[getActiveTenant] User no longer has membership to tenant:',
        tenantId
      )
      // Cookie is stale - user lost access to this tenant
      return null
    }

    // 5. Fetch and return full tenant data
    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenantRow) {
      console.warn('[getActiveTenant] Tenant not found:', tenantId)
      return null
    }

    return transformTenantRow(tenantRow as unknown as TenantRow)
  } catch (error) {
    console.error('[getActiveTenant] Unexpected error:', error)
    return null
  }
}
