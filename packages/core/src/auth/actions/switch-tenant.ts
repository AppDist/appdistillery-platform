'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { createServerSupabaseClient } from '../supabase-server'
import { ACTIVE_TENANT_COOKIE, COOKIE_MAX_AGE } from '../constants'

/**
 * Result type for tenant switching operations
 * Uses discriminated union for type-safe error handling
 */
type SwitchTenantResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Schema for validating switch tenant input
 * - tenantId: string UUID of tenant to switch to
 * - null: switch to personal mode (no tenant)
 */
const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid().nullable(),
})

/**
 * Switch the active tenant for the authenticated user
 *
 * Sets a cookie to track the active tenant. If tenantId is provided,
 * validates that the user is a member of that tenant before switching.
 * If tenantId is null, switches to personal mode (no active tenant).
 *
 * @param input - Object with tenantId (string UUID) or null for personal mode
 * @returns Success or error result
 *
 * @example
 * ```typescript
 * // Switch to a tenant
 * const result = await switchTenant({ tenantId: 'uuid-here' })
 * if (result.success) {
 *   console.log('Switched to tenant')
 * }
 *
 * // Switch to personal mode
 * const result = await switchTenant({ tenantId: null })
 * if (result.success) {
 *   console.log('Switched to personal mode')
 * }
 * ```
 */
export async function switchTenant(
  input: unknown
): Promise<SwitchTenantResult> {
  try {
    // 1. Validate input with Zod
    const validated = SwitchTenantSchema.parse(input)

    // 2. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: You must be logged in to switch tenants',
      }
    }

    // 3. If switching to personal mode (null), just clear/set empty cookie
    if (validated.tenantId === null) {
      const cookieStore = await cookies()
      cookieStore.set(ACTIVE_TENANT_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })

      return { success: true }
    }

    // 4. Validate user is a member of the tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', validated.tenantId)
      .single()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'You are not a member of this tenant',
      }
    }

    // 5. Set active tenant cookie
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_TENANT_COOKIE, validated.tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return { success: true }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: tenantId must be a valid UUID or null',
      }
    }

    // Handle unexpected errors
    console.error('[switchTenant] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
