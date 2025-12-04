import { describe, it, expect } from 'vitest'
import { transformTenantRow, transformMemberRow } from './transforms'
import type { TenantRow, TenantMemberRow } from './types'

describe('transformTenantRow', () => {
  describe('field transformation', () => {
    it('transforms all snake_case fields to camelCase', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Acme Corp',
        slug: 'acme-corp',
        org_number: '123456789',
        billing_email: 'billing@acme.com',
        settings: { theme: 'dark' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result).toHaveProperty('orgNumber')
      expect(result).toHaveProperty('billingEmail')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      expect(result).not.toHaveProperty('org_number')
      expect(result).not.toHaveProperty('billing_email')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('updated_at')
    })

    it('preserves fields that do not need transformation', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'household',
        name: 'Smith Family',
        slug: 'smith-family',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.id).toBe('tenant-123')
      expect(result.type).toBe('household')
      expect(result.name).toBe('Smith Family')
      expect(result.slug).toBe('smith-family')
    })

    it('converts date strings to Date objects', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Test Org',
        slug: 'test-org',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:30:45Z',
      }

      const result = transformTenantRow(row)

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.updatedAt.toISOString()).toBe('2024-01-15T12:30:45.000Z')
    })
  })

  describe('organization tenants', () => {
    it('transforms organization tenant with all fields', () => {
      const row: TenantRow = {
        id: 'tenant-org',
        type: 'organization',
        name: 'Acme Corporation',
        slug: 'acme',
        org_number: '987654321',
        billing_email: 'billing@acme.com',
        settings: { invoicePrefix: 'ACME', currency: 'USD' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.id).toBe('tenant-org')
      expect(result.type).toBe('organization')
      expect(result.name).toBe('Acme Corporation')
      expect(result.slug).toBe('acme')
      expect(result.orgNumber).toBe('987654321')
      expect(result.billingEmail).toBe('billing@acme.com')
      expect(result.settings).toEqual({ invoicePrefix: 'ACME', currency: 'USD' })
    })

    it('handles organization with null optional fields', () => {
      const row: TenantRow = {
        id: 'tenant-org',
        type: 'organization',
        name: 'New Org',
        slug: 'new-org',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.orgNumber).toBeNull()
      expect(result.billingEmail).toBeNull()
      expect(result.settings).toEqual({})
    })
  })

  describe('household tenants', () => {
    it('transforms household tenant with all fields', () => {
      const row: TenantRow = {
        id: 'tenant-house',
        type: 'household',
        name: 'Smith Family',
        slug: 'smith-family',
        org_number: null,
        billing_email: 'family@smith.com',
        settings: { notifications: true },
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-15T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.id).toBe('tenant-house')
      expect(result.type).toBe('household')
      expect(result.name).toBe('Smith Family')
      expect(result.slug).toBe('smith-family')
      expect(result.orgNumber).toBeNull()
      expect(result.billingEmail).toBe('family@smith.com')
      expect(result.settings).toEqual({ notifications: true })
    })

    it('handles household with minimal fields', () => {
      const row: TenantRow = {
        id: 'tenant-house',
        type: 'household',
        name: 'Minimal House',
        slug: 'minimal',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.type).toBe('household')
      expect(result.orgNumber).toBeNull()
      expect(result.billingEmail).toBeNull()
      expect(result.settings).toEqual({})
    })
  })

  describe('settings field', () => {
    it('preserves complex settings object', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Test',
        slug: 'test',
        org_number: null,
        billing_email: null,
        settings: {
          theme: 'dark',
          locale: 'en-US',
          notifications: {
            email: true,
            sms: false,
          },
          features: ['analytics', 'reporting'],
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.settings).toEqual({
        theme: 'dark',
        locale: 'en-US',
        notifications: {
          email: true,
          sms: false,
        },
        features: ['analytics', 'reporting'],
      })
    })

    it('handles empty settings object', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'household',
        name: 'Test',
        slug: 'test',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformTenantRow(row)

      expect(result.settings).toEqual({})
    })
  })

  describe('date parsing', () => {
    it('parses ISO 8601 date strings correctly', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'household',
        name: 'Test',
        slug: 'test',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T10:30:45.123Z',
        updated_at: '2024-12-31T23:59:59.999Z',
      }

      const result = transformTenantRow(row)

      expect(result.createdAt.getFullYear()).toBe(2024)
      expect(result.createdAt.getMonth()).toBe(0) // January is 0
      expect(result.createdAt.getDate()).toBe(1)
      expect(result.updatedAt.getFullYear()).toBe(2024)
      expect(result.updatedAt.getMonth()).toBe(11) // December is 11
      expect(result.updatedAt.getDate()).toBe(31)
    })

    it('handles different date formats from Postgres', () => {
      const row: TenantRow = {
        id: 'tenant-123',
        type: 'household',
        name: 'Test',
        slug: 'test',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-15T12:30:45.678Z',
      }

      const result = transformTenantRow(row)

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })
  })
})

describe('transformMemberRow', () => {
  describe('field transformation', () => {
    it('transforms all snake_case fields to camelCase', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'admin',
        joined_at: '2024-01-10T10:30:00Z',
      }

      const result = transformMemberRow(row)

      expect(result).toHaveProperty('tenantId')
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('joinedAt')
      expect(result).not.toHaveProperty('tenant_id')
      expect(result).not.toHaveProperty('user_id')
      expect(result).not.toHaveProperty('joined_at')
    })

    it('preserves fields that do not need transformation', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'owner',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.id).toBe('membership-123')
      expect(result.role).toBe('owner')
    })

    it('converts date strings to Date objects', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'member',
        joined_at: '2024-01-10T15:45:30Z',
      }

      const result = transformMemberRow(row)

      expect(result.joinedAt).toBeInstanceOf(Date)
      expect(result.joinedAt.toISOString()).toBe('2024-01-10T15:45:30.000Z')
    })
  })

  describe('role types', () => {
    it('handles owner role correctly', () => {
      const row: TenantMemberRow = {
        id: 'membership-owner',
        tenant_id: 'tenant-123',
        user_id: 'user-456',
        role: 'owner',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.role).toBe('owner')
    })

    it('handles admin role correctly', () => {
      const row: TenantMemberRow = {
        id: 'membership-admin',
        tenant_id: 'tenant-123',
        user_id: 'user-456',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.role).toBe('admin')
    })

    it('handles member role correctly', () => {
      const row: TenantMemberRow = {
        id: 'membership-member',
        tenant_id: 'tenant-123',
        user_id: 'user-456',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.role).toBe('member')
    })
  })

  describe('relationship fields', () => {
    it('correctly transforms tenant_id to tenantId', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-special-id',
        user_id: 'user-456',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.tenantId).toBe('tenant-special-id')
    })

    it('correctly transforms user_id to userId', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-special-id',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result.userId).toBe('user-special-id')
    })
  })

  describe('date parsing', () => {
    it('parses ISO 8601 date strings correctly', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'admin',
        joined_at: '2024-06-15T14:22:33.456Z',
      }

      const result = transformMemberRow(row)

      // Check using toISOString to avoid timezone issues
      expect(result.joinedAt).toBeInstanceOf(Date)
      expect(result.joinedAt.toISOString()).toBe('2024-06-15T14:22:33.456Z')
    })

    it('handles different date formats from Postgres', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'member',
        joined_at: '2024-01-01T00:00:00.000Z',
      }

      const result = transformMemberRow(row)

      expect(result.joinedAt).toBeInstanceOf(Date)
      expect(result.joinedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    })

    it('preserves milliseconds in date parsing', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'member',
        joined_at: '2024-01-01T12:30:45.789Z',
      }

      const result = transformMemberRow(row)

      expect(result.joinedAt.getMilliseconds()).toBe(789)
    })
  })

  describe('data integrity', () => {
    it('does not mutate the original row object', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const originalRow = { ...row }
      transformMemberRow(row)

      expect(row).toEqual(originalRow)
    })

    it('creates a new object instead of modifying input', () => {
      const row: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: 'tenant-456',
        user_id: 'user-789',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      }

      const result = transformMemberRow(row)

      expect(result).not.toBe(row)
    })
  })
})

describe('transform functions integration', () => {
  it('transforms tenant and member data consistently', () => {
    const tenantRow: TenantRow = {
      id: 'tenant-123',
      type: 'organization',
      name: 'Test Org',
      slug: 'test-org',
      org_number: '123456789',
      billing_email: 'billing@test.com',
      settings: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    }

    const memberRow: TenantMemberRow = {
      id: 'membership-456',
      tenant_id: 'tenant-123',
      user_id: 'user-789',
      role: 'owner',
      joined_at: '2024-01-01T00:00:00Z',
    }

    const tenant = transformTenantRow(tenantRow)
    const member = transformMemberRow(memberRow)

    // Verify relationship consistency
    expect(member.tenantId).toBe(tenant.id)
  })

  it('both functions use consistent camelCase naming', () => {
    const tenantRow: TenantRow = {
      id: 'tenant-123',
      type: 'household',
      name: 'Test',
      slug: 'test',
      org_number: null,
      billing_email: null,
      settings: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const memberRow: TenantMemberRow = {
      id: 'membership-123',
      tenant_id: 'tenant-123',
      user_id: 'user-456',
      role: 'member',
      joined_at: '2024-01-01T00:00:00Z',
    }

    const tenant = transformTenantRow(tenantRow)
    const member = transformMemberRow(memberRow)

    // Check no snake_case properties remain
    const tenantKeys = Object.keys(tenant)
    const memberKeys = Object.keys(member)

    tenantKeys.forEach((key) => {
      expect(key).not.toMatch(/_/)
    })

    memberKeys.forEach((key) => {
      expect(key).not.toMatch(/_/)
    })
  })

  it('both functions convert dates to Date objects', () => {
    const tenantRow: TenantRow = {
      id: 'tenant-123',
      type: 'household',
      name: 'Test',
      slug: 'test',
      org_number: null,
      billing_email: null,
      settings: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const memberRow: TenantMemberRow = {
      id: 'membership-123',
      tenant_id: 'tenant-123',
      user_id: 'user-456',
      role: 'member',
      joined_at: '2024-01-01T00:00:00Z',
    }

    const tenant = transformTenantRow(tenantRow)
    const member = transformMemberRow(memberRow)

    expect(tenant.createdAt).toBeInstanceOf(Date)
    expect(tenant.updatedAt).toBeInstanceOf(Date)
    expect(member.joinedAt).toBeInstanceOf(Date)
  })
})
