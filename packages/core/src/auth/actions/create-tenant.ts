'use server'

import {
  CreateHouseholdSchema,
  CreateOrganizationSchema,
  type CreateHouseholdInput,
  type CreateOrganizationInput,
} from '../schemas/tenant'
import type { Tenant } from '../types'
import {
  getAuthenticatedUserId,
  isSlugTaken,
  createTenantWithOwner,
  fetchTenant
} from '../helpers'

/**
 * Result type for tenant creation operations
 * Uses discriminated union for type-safe error handling
 */
type CreateTenantResult =
  | { success: true; data: Tenant }
  | { success: false; error: string }

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
    const validated = CreateHouseholdSchema.parse(input)

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { success: false, error: 'Unauthorized: You must be logged in to create a household' }
    }

    const slugExists = await isSlugTaken(validated.slug)
    if (slugExists) {
      return { success: false, error: `The slug "${validated.slug}" is already taken. Please choose a different one.` }
    }

    const tenantId = await createTenantWithOwner('household', validated.name, validated.slug)
    if (!tenantId) {
      return { success: false, error: 'Failed to create household. Please try again.' }
    }

    const tenant = await fetchTenant(tenantId)
    if (!tenant) {
      return { success: false, error: 'Household created but failed to retrieve details.' }
    }

    return { success: true, data: tenant }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: error.message }
    }
    console.error('[createHousehold] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
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
    const validated = CreateOrganizationSchema.parse(input)

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { success: false, error: 'Unauthorized: You must be logged in to create an organization' }
    }

    const slugExists = await isSlugTaken(validated.slug)
    if (slugExists) {
      return { success: false, error: `The slug "${validated.slug}" is already taken. Please choose a different one.` }
    }

    const tenantId = await createTenantWithOwner(
      'organization',
      validated.name,
      validated.slug,
      validated.orgNumber,
      validated.billingEmail
    )
    if (!tenantId) {
      return { success: false, error: 'Failed to create organization. Please try again.' }
    }

    const tenant = await fetchTenant(tenantId)
    if (!tenant) {
      return { success: false, error: 'Organization created but failed to retrieve details.' }
    }

    return { success: true, data: tenant }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: error.message }
    }
    console.error('[createOrganization] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
