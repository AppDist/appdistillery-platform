import type { Tenant, TenantRow, TenantMember, TenantMemberRow } from './types'

/**
 * Transform snake_case database row to camelCase Tenant object
 *
 * Converts Postgres snake_case column names to TypeScript camelCase
 * properties and transforms string dates to Date objects.
 *
 * @param row - Raw database row from tenants table
 * @returns Tenant object with camelCase properties
 */
export function transformTenantRow(row: TenantRow): Tenant {
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
 * Transform snake_case database row to camelCase TenantMember object
 *
 * Converts Postgres snake_case column names to TypeScript camelCase
 * properties and transforms string dates to Date objects.
 *
 * @param row - Raw database row from tenant_members table
 * @returns TenantMember object with camelCase properties
 */
export function transformMemberRow(row: TenantMemberRow): TenantMember {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: new Date(row.joined_at),
  }
}
