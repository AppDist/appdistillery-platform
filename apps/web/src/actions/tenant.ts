'use server'

/**
 * Tenant creation Server Actions
 *
 * This file wraps the tenant creation actions from @appdistillery/core/auth
 * to prevent client components from importing server-only code (next/headers).
 *
 * Import these actions in client components instead of importing directly from
 * @appdistillery/core/auth.
 */

import {
  createHousehold as coreCreateHousehold,
  createOrganization as coreCreateOrganization,
  type CreateHouseholdInput,
  type CreateOrganizationInput,
} from '@appdistillery/core/auth'

export async function createHousehold(input: CreateHouseholdInput) {
  return coreCreateHousehold(input)
}

export async function createOrganization(input: CreateOrganizationInput) {
  return coreCreateOrganization(input)
}
