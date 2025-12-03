'use server'

import { z } from 'zod'
import { createServerSupabaseClient } from '../../auth/supabase-server'
import { getSessionContext } from '../../auth'
import type { Database } from '@appdistillery/database'

type TenantModuleRow = Database['public']['Tables']['tenant_modules']['Row']

/**
 * Input schema for uninstalling a module
 */
export const UninstallModuleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  /**
   * Soft delete: disable module but keep data
   * Hard delete: remove tenant_modules record (may cascade delete module data)
   */
  hardDelete: z.boolean().optional().default(false),
})

export type UninstallModuleInput = z.infer<typeof UninstallModuleSchema>

/**
 * Result type for uninstall module operation
 */
export type UninstallModuleResult =
  | { success: true; data: { moduleId: string; hardDeleted: boolean } }
  | { success: false; error: string }

/**
 * Uninstall a module for the active tenant
 *
 * This Server Action supports two modes:
 * 1. Soft delete (default): Sets enabled=false, preserves module data
 * 2. Hard delete: Removes tenant_modules record (may cascade delete module data)
 *
 * Steps:
 * 1. Validates authentication and active tenant
 * 2. Checks if module is installed
 * 3. Either disables (soft) or deletes (hard) the tenant_modules record
 *
 * @param input - Module uninstallation data
 * @returns Result with success status
 *
 * @example
 * ```typescript
 * 'use client'
 * import { uninstallModule } from '@appdistillery/core/modules'
 *
 * // Soft delete (default) - disable but keep data
 * async function handleDisable() {
 *   const result = await uninstallModule({ moduleId: 'agency' })
 *   if (result.success) {
 *     console.log('Module disabled')
 *   }
 * }
 *
 * // Hard delete - remove all module data
 * async function handleUninstall() {
 *   const result = await uninstallModule({
 *     moduleId: 'agency',
 *     hardDelete: true
 *   })
 *   if (result.success) {
 *     console.log('Module uninstalled')
 *   }
 * }
 * ```
 */
export async function uninstallModule(
  input: unknown
): Promise<UninstallModuleResult> {
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
    const validated = UninstallModuleSchema.parse(input)

    const supabase = await createServerSupabaseClient()

    // 3. Check if module is installed
    const { data: existing, error: existingError } = await supabase
      .from('tenant_modules')
      .select('id, enabled')
      .eq('tenant_id', session.tenant.id)
      .eq('module_id', validated.moduleId)
      .maybeSingle<Pick<TenantModuleRow, 'id' | 'enabled'>>()

    if (existingError || !existing) {
      return { success: false, error: 'Module not installed' }
    }

    // 4a. Soft delete: disable module but keep data
    if (!validated.hardDelete) {
      if (!existing.enabled) {
        return { success: false, error: 'Module already disabled' }
      }

      const updateData = {
        enabled: false,
        updated_at: new Date().toISOString(),
      }

      // Type assertion needed for Supabase client chain inference
      const { error: updateError } = await (supabase
        .from('tenant_modules') as any)
        .update(updateData)
        .eq('id', existing.id)

      if (updateError) {
        console.error('[uninstallModule] Database error:', updateError)
        return {
          success: false,
          error: 'Failed to disable module. Please try again.',
        }
      }

      return {
        success: true,
        data: { moduleId: validated.moduleId, hardDeleted: false },
      }
    }

    // 4b. Hard delete: remove tenant_modules record
    const { error: deleteError } = await supabase
      .from('tenant_modules')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('[uninstallModule] Database error:', deleteError)
      return {
        success: false,
        error: 'Failed to uninstall module. Please try again.',
      }
    }

    return {
      success: true,
      data: { moduleId: validated.moduleId, hardDeleted: true },
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
    console.error('[uninstallModule] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
