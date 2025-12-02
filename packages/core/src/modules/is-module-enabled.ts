import { createServerSupabaseClient } from '../auth/supabase-server'
import type { Database } from '@appdistillery/database'

type TenantModuleRow = Database['public']['Tables']['tenant_modules']['Row']

/**
 * Check if a module is enabled for a tenant
 *
 * Returns true if the module is both installed AND enabled for the tenant.
 * Returns false if:
 * - Module is not installed
 * - Module is installed but disabled
 * - Database query fails
 *
 * @param tenantId - The tenant ID to check
 * @param moduleId - The module ID to check (e.g., 'agency')
 * @returns true if module is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const session = await getSessionContext()
 * if (!session?.tenant) throw new Error('No active tenant')
 *
 * const canUseAgency = await isModuleEnabled(session.tenant.id, 'agency')
 * if (!canUseAgency) {
 *   throw new Error('Agency module not enabled for this tenant')
 * }
 * ```
 */
export async function isModuleEnabled(
  tenantId: string,
  moduleId: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    // Query with tenant isolation
    const { data, error } = await supabase
      .from('tenant_modules')
      .select('enabled')
      .eq('tenant_id', tenantId)
      .eq('module_id', moduleId)
      .maybeSingle<Pick<TenantModuleRow, 'enabled'>>()

    if (error) {
      // PGRST116 = no rows returned (module not installed)
      if (error.code === 'PGRST116') {
        return false
      }

      console.error('[isModuleEnabled] Database error:', error)
      return false
    }

    return data?.enabled ?? false
  } catch (error) {
    console.error('[isModuleEnabled] Unexpected error:', error)
    return false
  }
}
