/**
 * TypeScript types for the identity/tenant system
 * Matches schema from: supabase/migrations/20251201141133_create_identity_tables.sql
 */

/**
 * Tenant type discriminator
 * - 'household': Family or shared living account
 * - 'organization': Business/company account
 *
 * Note: Personal users work without a tenant (tenant = null)
 */
export type TenantType = 'household' | 'organization'

/**
 * Member role within a tenant
 * - 'owner': Full control, can delete tenant
 * - 'admin': Can manage members and settings
 * - 'member': Standard user access
 */
export type MemberRole = 'owner' | 'admin' | 'member'

/**
 * User profile extending auth.users
 * Contains application-specific profile data
 */
export interface UserProfile {
  id: string
  displayName: string | null
  email: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Tenant (household or organization)
 * Personal users don't have a tenant
 */
export interface Tenant {
  id: string
  type: TenantType
  name: string
  slug: string
  orgNumber: string | null      // Business registration (organizations only)
  billingEmail: string | null    // Billing contact email
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * Membership linking a user to a tenant with a role
 */
export interface TenantMember {
  id: string
  tenantId: string
  userId: string
  role: MemberRole
  joinedAt: Date
}

/**
 * Combined type for membership with full tenant details
 * Used when fetching a user's tenants
 */
export interface TenantMembership {
  tenant: Tenant
  membership: TenantMember
}

/**
 * Database row types (snake_case from Postgres)
 * Used internally for transforming DB results
 */
export interface UserProfileRow {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface TenantRow {
  id: string
  type: TenantType
  name: string
  slug: string
  org_number: string | null
  billing_email: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TenantMemberRow {
  id: string
  tenant_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}
