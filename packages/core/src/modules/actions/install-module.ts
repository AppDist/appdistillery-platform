'use server'

import { z } from 'zod'
import { createServerSupabaseClient } from '../../auth/supabase-server'
import { getSessionContext } from '../../auth'
import { InstallModuleSchema } from '../schemas'
import { invalidateModuleCache } from '../is-module-enabled'
import type { Database, Json } from '@appdistillery/database'
import { logger } from '../../utils/logger';

type ModuleRow = Database['public']['Tables']['modules']['Row']
type TenantModuleRow = Database['public']['Tables']['tenant_modules']['Row']

// Re-export types for convenience (types are safe in 'use server' files)
export type { InstallModuleInput } from '../schemas'

/**
 * Result type for install module operation
 */
export type InstallModuleResult =
  | { success: true; data: { id: string; moduleId: string } }
  | { success: false; error: string }

/**
 * Install a module for the active tenant
 *
 * This Server Action:
 * 1. Validates authentication and active tenant
 * 2. Validates that the module exists and is active
 * 3. Checks if module is already installed
 * 4. Creates a tenant_modules record with enabled=true
 *
 * @param input - Module installation data
 * @returns Result with success status
 *
 * @example
 * ```typescript
 * 'use client'
 * import { installModule } from '@appdistillery/core/modules'
 *
 * async function handleInstall() {
 *   const result = await installModule({
 *     moduleId: 'agency',
 *     settings: { featureFlags: { proposals: true } }
 *   })
 *
 *   if (result.success) {
 *     console.log('Module installed:', result.data.moduleId)
 *   } else {
 *     console.error('Failed:', result.error)
 *   }
 * }
 * ```
 */
export async function installModule(
  input: unknown
): Promise<InstallModuleResult> {
  try {
    // 1. Validate authentication and get session context
    const session = await getSessionContext()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!session.tenant) {
      return { success: false, error: 'No active tenant' }
    }

    // Verify user has admin privileges
    if (!session.membership || !['owner', 'admin'].includes(session.membership.role)) {
      return { success: false, error: 'Forbidden: Admin access required' }
    }

    // 2. Validate input with Zod
    const validated = InstallModuleSchema.parse(input)

    const supabase = await createServerSupabaseClient()

    // 3. Verify module exists and is active
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, is_active')
      .eq('id', validated.moduleId)
      .maybeSingle<Pick<ModuleRow, 'id' | 'is_active'>>()

    if (moduleError || !module) {
      return { success: false, error: 'Module not found' }
    }

    if (!module.is_active) {
      return { success: false, error: 'Module is not active' }
    }

    // 4. Check if module is already installed
    const { data: existing } = await supabase
      .from('tenant_modules')
      .select('id, enabled')
      .eq('tenant_id', session.tenant.id)
      .eq('module_id', validated.moduleId)
      .maybeSingle<Pick<TenantModuleRow, 'id' | 'enabled'>>()

    if (existing) {
      // If already installed but disabled, re-enable it
      if (!existing.enabled) {
        // Supabase RLS inference limitation: type assertion needed for update operations
        // This is safe because we've already validated tenant ownership via session.tenant.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('tenant_modules') as any)
          .update({
            enabled: true,
            settings: validated.settings as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          logger.error('installModule', 'Database error', { error: updateError });
          return {
            success: false,
            error: 'Failed to re-enable module. Please try again.',
          }
        }

        // Invalidate cache after re-enabling
        invalidateModuleCache(session.tenant.id, validated.moduleId);

        return {
          success: true,
          data: { id: existing.id, moduleId: validated.moduleId },
        }
      }

      return { success: false, error: 'Module already installed' }
    }

    // 5. Install module (create tenant_modules record)
    // Supabase RLS inference limitation: type assertion needed for insert operations
    // This is safe because we're inserting with the validated session.tenant.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: installed, error: installError } = await (supabase.from('tenant_modules') as any)
      .insert({
        tenant_id: session.tenant.id,
        module_id: validated.moduleId,
        enabled: true,
        settings: validated.settings as Json,
      })
      .select('id, module_id')
      .single()

    if (installError || !installed) {
      logger.error('installModule', 'Database error', { error: installError });
      return {
        success: false,
        error: 'Failed to install module. Please try again.',
      }
    }

    // Invalidate cache after successful install
    invalidateModuleCache(session.tenant.id, installed.module_id);

    return {
      success: true,
      data: { id: installed.id, moduleId: installed.module_id },
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      }
    }

    // Handle unexpected errors
    logger.error('installModule', 'Unexpected error', { error });
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
