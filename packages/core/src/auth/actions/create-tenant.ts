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
import { ErrorCodes, createErrorResult, type ErrorCode } from '../../utils/error-codes'

/**
 * Result type for tenant creation operations
 * Uses discriminated union for type-safe error handling
 */
type CreateTenantResult =
  | { success: true; data: Tenant }
  | { success: false; error: string; code: ErrorCode }

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
      return createErrorResult(ErrorCodes.UNAUTHORIZED)
    }

    const slugExists = await isSlugTaken(validated.slug)
    if (slugExists) {
      return createErrorResult(
        ErrorCodes.SLUG_ALREADY_TAKEN,
        `The slug "${validated.slug}" is already taken. Please choose a different one.`
      )
    }

    const tenantId = await createTenantWithOwner('household', validated.name, validated.slug)
    if (!tenantId) {
      return createErrorResult(ErrorCodes.TENANT_CREATION_FAILED)
    }

    const tenant = await fetchTenant(tenantId)
    if (!tenant) {
      return createErrorResult(
        ErrorCodes.TENANT_NOT_FOUND,
        'Household created but failed to retrieve details.'
      )
    }

    return { success: true, data: tenant }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResult(ErrorCodes.VALIDATION_ERROR, error.message)
    }
    console.error('[createHousehold] Unexpected error:', error)
    return createErrorResult(ErrorCodes.INTERNAL_ERROR)
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
      return createErrorResult(ErrorCodes.UNAUTHORIZED)
    }

    const slugExists = await isSlugTaken(validated.slug)
    if (slugExists) {
      return createErrorResult(
        ErrorCodes.SLUG_ALREADY_TAKEN,
        `The slug "${validated.slug}" is already taken. Please choose a different one.`
      )
    }

    const tenantId = await createTenantWithOwner(
      'organization',
      validated.name,
      validated.slug,
      validated.orgNumber,
      validated.billingEmail
    )
    if (!tenantId) {
      return createErrorResult(ErrorCodes.TENANT_CREATION_FAILED)
    }

    const tenant = await fetchTenant(tenantId)
    if (!tenant) {
      return createErrorResult(
        ErrorCodes.TENANT_NOT_FOUND,
        'Organization created but failed to retrieve details.'
      )
    }

    return { success: true, data: tenant }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResult(ErrorCodes.VALIDATION_ERROR, error.message)
    }
    console.error('[createOrganization] Unexpected error:', error)
    return createErrorResult(ErrorCodes.INTERNAL_ERROR)
  }
}
