import { createServerSupabaseClient } from './supabase-server'
import type {
  TenantMembership,
  TenantRow,
} from './types'
import { transformTenantRow, transformMemberRow } from './transforms'

/**
 * Fetch all tenants for the authenticated user
 *
 * Returns an array of TenantMembership objects containing both the tenant
 * details and the user's membership information (role, joined date).
 *
 * Personal users (those without any tenant memberships) will receive an
 * empty array. They can work directly with the system without a tenant.
 *
 * @returns Array of tenant memberships, or empty array if user has no tenants
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const tenants = await getUserTenants()
 *
 * if (tenants.length === 0) {
 *   // Personal user - no tenant required
 *   console.log('Working as personal user')
 * } else {
 *   // User has tenants
 *   tenants.forEach(({ tenant, membership }) => {
 *     console.log(`${tenant.name} - ${membership.role}`)
 *   })
 * }
 * ```
 */
export async function getUserTenants(): Promise<TenantMembership[]> {
  const supabase = await createServerSupabaseClient()

  // Get authenticated user (validates JWT)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: User must be authenticated')
  }

  // Query tenant_members joined with tenants
  // RLS policies ensure users can only see their own memberships
  const { data, error } = await supabase
    .from('tenant_members')
    .select(
      `
      id,
      tenant_id,
      user_id,
      role,
      joined_at,
      tenants (
        id,
        type,
        name,
        slug,
        org_number,
        billing_email,
        settings,
        created_at,
        updated_at
      )
    `
    )
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('[getUserTenants] Database error:', error)
    throw new Error('Failed to fetch user tenants')
  }

  // Handle case where user has no tenants (personal user)
  if (!data || data.length === 0) {
    return []
  }

  // Transform database rows to TypeScript objects
  // Using 'as any' temporarily until database types are generated
  return (data as any[])
    .filter((row) => row.tenants) // Type guard for joined data
    .map((row) => {
      // Supabase returns joined data as a single object (not array)
      const tenantRow = Array.isArray(row.tenants)
        ? row.tenants[0]
        : row.tenants

      return {
        tenant: transformTenantRow(tenantRow as TenantRow),
        membership: transformMemberRow({
          id: row.id,
          tenant_id: row.tenant_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.joined_at,
        }),
      }
    })
}
