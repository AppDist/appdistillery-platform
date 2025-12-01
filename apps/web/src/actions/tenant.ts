'use server'

/**
 * Tenant management Server Actions
 *
 * This file wraps tenant actions from @appdistillery/core/auth
 * to prevent client components from importing server-only code (next/headers).
 *
 * Import these actions in client components instead of importing directly from
 * @appdistillery/core/auth.
 */

import {
  createHousehold as coreCreateHousehold,
  createOrganization as coreCreateOrganization,
  switchTenant as coreSwitchTenant,
  type CreateHouseholdInput,
  type CreateOrganizationInput,
} from '@appdistillery/core/auth'

/**
 * Create a household tenant
 */
export async function createHousehold(input: CreateHouseholdInput) {
  return coreCreateHousehold(input)
}

/**
 * Create an organization tenant
 */
export async function createOrganization(input: CreateOrganizationInput) {
  return coreCreateOrganization(input)
}

/**
 * Switch the active tenant
 *
 * @param tenantId - UUID of tenant to switch to, or null for personal mode
 */
export async function switchTenant(input: { tenantId: string | null }) {
  return coreSwitchTenant(input)
}
