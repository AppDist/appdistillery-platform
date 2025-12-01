import { z } from 'zod'

/**
 * Zod schema for creating a household tenant
 *
 * Households are shared living arrangements (family, roommates, etc.)
 * with simpler requirements than organizations.
 */
export const CreateHouseholdSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .describe('Display name for the household (e.g., "Smith Family")'),

  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug cannot exceed 30 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens (e.g., "smith-family")'
    )
    .describe('URL-friendly unique identifier'),
})

/**
 * Zod schema for creating an organization tenant
 *
 * Organizations are business entities with additional fields
 * for business registration and billing.
 */
export const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .describe('Legal or display name for the organization'),

  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug cannot exceed 30 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens (e.g., "acme-corp")'
    )
    .describe('URL-friendly unique identifier'),

  orgNumber: z
    .string()
    .optional()
    .describe(
      'Business registration number (e.g., organization number, VAT number)'
    ),

  billingEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .describe('Email address for billing and invoices'),
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type CreateHouseholdInput = z.infer<typeof CreateHouseholdSchema>
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>
