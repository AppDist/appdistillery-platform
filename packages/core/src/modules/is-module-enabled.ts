import { createServerSupabaseClient } from '../auth/supabase-server'
import type { Database } from '@appdistillery/database'
import { logger } from '../utils/logger';

type TenantModuleRow = Database['public']['Tables']['tenant_modules']['Row']

/**
 * In-memory cache for module enablement status
 * Key format: `${tenantId}:${moduleId}`
 */
const moduleCache = new Map<string, { enabled: boolean; expires: number }>();

/**
 * Cache TTL: 1 minute
 * Balance between freshness and performance
 */
const CACHE_TTL = 60_000;

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
    // Check cache first
    const cacheKey = `${tenantId}:${moduleId}`;
    const cached = moduleCache.get(cacheKey);

    if (cached && Date.now() < cached.expires) {
      logger.debug('isModuleEnabled', 'Cache hit', { tenantId, moduleId, enabled: cached.enabled });
      return cached.enabled;
    }

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
        // Cache the "not installed" result
        moduleCache.set(cacheKey, {
          enabled: false,
          expires: Date.now() + CACHE_TTL
        });
        return false
      }

      logger.error('isModuleEnabled', 'Database error', { error });
      return false
    }

    const enabled = data?.enabled ?? false;

    // Cache the result
    moduleCache.set(cacheKey, {
      enabled,
      expires: Date.now() + CACHE_TTL
    });

    logger.debug('isModuleEnabled', 'Cache miss - stored result', { tenantId, moduleId, enabled });

    return enabled;
  } catch (error) {
    logger.error('isModuleEnabled', 'Unexpected error', { error });
    return false
  }
}

/**
 * Invalidate module cache for a tenant
 *
 * Call this when module installation/uninstallation/enablement changes.
 * If moduleId is provided, only that module's cache is cleared.
 * If moduleId is omitted, all modules for the tenant are cleared.
 *
 * @param tenantId - The tenant ID
 * @param moduleId - Optional specific module ID to invalidate
 *
 * @example
 * ```typescript
 * // After installing a module
 * invalidateModuleCache(tenantId, 'agency')
 *
 * // After changing tenant settings (clear all modules)
 * invalidateModuleCache(tenantId)
 * ```
 */
export function invalidateModuleCache(
  tenantId: string,
  moduleId?: string
): void {
  if (moduleId) {
    // Invalidate specific module
    const cacheKey = `${tenantId}:${moduleId}`;
    const deleted = moduleCache.delete(cacheKey);
    logger.debug('invalidateModuleCache', 'Invalidated specific module', {
      tenantId,
      moduleId,
      deleted
    });
  } else {
    // Invalidate all modules for tenant
    let count = 0;
    const keysArray = Array.from(moduleCache.keys());
    for (const key of keysArray) {
      if (key.startsWith(`${tenantId}:`)) {
        moduleCache.delete(key);
        count++;
      }
    }
    logger.debug('invalidateModuleCache', 'Invalidated all modules for tenant', {
      tenantId,
      count
    });
  }
}

/**
 * Clear all cached module data
 *
 * @internal This is primarily for testing purposes
 */
export function clearModuleCache(): void {
  moduleCache.clear();
}
