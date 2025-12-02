import { createServerSupabaseClient } from '../auth/supabase-server'
import type { InstalledModule } from './types'

/**
 * Get all installed modules for a tenant
 *
 * Fetches modules that are installed for the specified tenant,
 * including their enabled status and settings.
 *
 * @param tenantId - The tenant ID to query modules for
 * @returns Array of installed modules (only enabled ones by default)
 *
 * @example
 * ```typescript
 * const session = await getSessionContext()
 * if (!session?.tenant) throw new Error('No active tenant')
 *
 * const modules = await getInstalledModules(session.tenant.id)
 * console.log(`Installed modules: ${modules.length}`)
 * ```
 */
export async function getInstalledModules(
  tenantId: string,
  options?: {
    /**
     * Include disabled modules in results
     * @default false
     */
    includeDisabled?: boolean
  }
): Promise<InstalledModule[]> {
  const supabase = await createServerSupabaseClient()

  // Build query with tenant isolation
  let query = supabase
    .from('tenant_modules')
    .select(
      `
      id,
      tenant_id,
      module_id,
      enabled,
      settings,
      installed_at,
      updated_at,
      module:modules (
        id,
        name,
        description,
        version,
        is_active,
        created_at
      )
    `
    )
    .eq('tenant_id', tenantId)

  // Filter for enabled modules unless explicitly including disabled
  if (!options?.includeDisabled) {
    query = query.eq('enabled', true)
  }

  // Order by installation date
  query = query.order('installed_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('[getInstalledModules] Database error:', error)
    throw new Error(`Failed to fetch installed modules: ${error.message}`)
  }

  if (!data) {
    return []
  }

  // Transform to camelCase with proper types
  return data.map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    moduleId: row.module_id,
    enabled: row.enabled,
    settings: (row.settings as Record<string, unknown>) ?? {},
    installedAt: new Date(row.installed_at),
    updatedAt: new Date(row.updated_at),
    module: {
      id: row.module.id,
      name: row.module.name,
      description: row.module.description,
      version: row.module.version,
      isActive: row.module.is_active,
      createdAt: new Date(row.module.created_at),
    },
  }))
}
