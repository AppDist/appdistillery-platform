'use server'

import { createServerSupabaseClient } from '../supabase-server'
import {
  CreateHouseholdSchema,
  CreateOrganizationSchema,
  type CreateHouseholdInput,
  type CreateOrganizationInput,
} from '../schemas/tenant'
import type { Tenant, TenantRow } from '../types'

/**
 * Result type for tenant creation operations
 * Uses discriminated union for type-safe error handling
 */
type CreateTenantResult =
  | { success: true; data: Tenant }
  | { success: false; error: string }

/**
 * Transform snake_case database row to camelCase Tenant object
 */
function transformTenantRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    slug: row.slug,
    orgNumber: row.org_number,
    billingEmail: row.billing_email,
    settings: row.settings,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Create a household tenant
 *
 * Creates a new household-type tenant and automatically adds the
 * authenticated user as the owner. Households are for family or
 * shared living arrangements.
 *
 * @param input - Household creation data (validated with Zod)
 * @returns Success with Tenant data, or error with message
 *
 * @example
 * ```typescript
 * const result = await createHousehold({
 *   name: 'Smith Family',
 *   slug: 'smith-family'
 * })
 *
 * if (result.success) {
 *   console.log('Household created:', result.data.id)
 * } else {
 *   console.error('Error:', result.error)
 * }
 * ```
 */
export async function createHousehold(
  input: unknown
): Promise<CreateTenantResult> {
  try {
    // 1. Validate input with Zod
    const validated = CreateHouseholdSchema.parse(input)

    // 2. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: You must be logged in to create a household',
      }
    }

    // 3. Check for duplicate slug
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', validated.slug)
      .single()

    if (existing) {
      return {
        success: false,
        error: `The slug "${validated.slug}" is already taken. Please choose a different one.`,
      }
    }

    // 4. Call database function to create tenant + membership atomically
    const { data, error } = await supabase.rpc('create_tenant_with_owner', {
      p_type: 'household' as const,
      p_name: validated.name,
      p_slug: validated.slug,
    } as any)

    if (error) {
      console.error('[createHousehold] Database error:', error)
      return {
        success: false,
        error: 'Failed to create household. Please try again.',
      }
    }

    // 5. Fetch the created tenant to return full details
    const { data: tenantRow, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', data)
      .single()

    if (fetchError || !tenantRow) {
      console.error('[createHousehold] Fetch error:', fetchError)
      return {
        success: false,
        error: 'Household created but failed to retrieve details.',
      }
    }

    // 6. Transform and return
    return {
      success: true,
      data: transformTenantRow(tenantRow as unknown as TenantRow),
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: error.message,
      }
    }

    // Handle unexpected errors
    console.error('[createHousehold] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Create an organization tenant
 *
 * Creates a new organization-type tenant and automatically adds the
 * authenticated user as the owner. Organizations are for business entities
 * and support additional fields like orgNumber and billingEmail.
 *
 * @param input - Organization creation data (validated with Zod)
 * @returns Success with Tenant data, or error with message
 *
 * @example
 * ```typescript
 * const result = await createOrganization({
 *   name: 'Acme Corporation',
 *   slug: 'acme-corp',
 *   orgNumber: '123456789',
 *   billingEmail: 'billing@acme.com'
 * })
 *
 * if (result.success) {
 *   console.log('Organization created:', result.data.id)
 * } else {
 *   console.error('Error:', result.error)
 * }
 * ```
 */
export async function createOrganization(
  input: unknown
): Promise<CreateTenantResult> {
  try {
    // 1. Validate input with Zod
    const validated = CreateOrganizationSchema.parse(input)

    // 2. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: You must be logged in to create an organization',
      }
    }

    // 3. Check for duplicate slug
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', validated.slug)
      .single()

    if (existing) {
      return {
        success: false,
        error: `The slug "${validated.slug}" is already taken. Please choose a different one.`,
      }
    }

    // 4. Call database function to create tenant + membership atomically
    const { data, error } = await supabase.rpc('create_tenant_with_owner', {
      p_type: 'organization' as const,
      p_name: validated.name,
      p_slug: validated.slug,
      ...(validated.orgNumber && { p_org_number: validated.orgNumber }),
      ...(validated.billingEmail && { p_billing_email: validated.billingEmail }),
    } as any)

    if (error) {
      console.error('[createOrganization] Database error:', error)
      return {
        success: false,
        error: 'Failed to create organization. Please try again.',
      }
    }

    // 5. Fetch the created tenant to return full details
    const { data: tenantRow, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', data)
      .single()

    if (fetchError || !tenantRow) {
      console.error('[createOrganization] Fetch error:', fetchError)
      return {
        success: false,
        error: 'Organization created but failed to retrieve details.',
      }
    }

    // 6. Transform and return
    return {
      success: true,
      data: transformTenantRow(tenantRow as unknown as TenantRow),
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: error.message,
      }
    }

    // Handle unexpected errors
    console.error('[createOrganization] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
