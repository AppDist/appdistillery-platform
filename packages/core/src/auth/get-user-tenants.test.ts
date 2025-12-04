import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserTenants } from './get-user-tenants'
import type { TenantRow, TenantMemberRow } from './types'

// Mock Supabase client - order returns a promise, not mockSupabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(),
}

vi.mock('./supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

describe('getUserTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('throws error when user is not authenticated (auth error)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await expect(getUserTenants()).rejects.toThrow(
        'Unauthorized: User must be authenticated'
      )

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not attempt tenant query if not authenticated
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('throws error when user object is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(getUserTenants()).rejects.toThrow(
        'Unauthorized: User must be authenticated'
      )

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not attempt tenant query if no user
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('personal mode (no tenants)', () => {
    const userId = 'user-personal'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('returns empty array when user has no tenants', async () => {
      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: [],
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result).toEqual([])
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns empty array when data is null', async () => {
      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: null,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result).toEqual([])
    })
  })

  describe('database error handling', () => {
    const userId = 'user-error'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('throws error when database query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: null,
          error: new Error('Database connection failed'),
        })
      )

      await expect(getUserTenants()).rejects.toThrow('Failed to fetch user tenants')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getUserTenants] Database error',
        expect.objectContaining({
          error: expect.any(Error),
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('successful tenant retrieval', () => {
    const userId = 'user-123'
    const tenantId1 = 'tenant-456'
    const tenantId2 = 'tenant-789'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('returns array of tenant memberships when user has tenants', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId1,
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId1,
            type: 'household',
            name: 'Smith Family',
            slug: 'smith-family',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 'membership-2',
          tenant_id: tenantId2,
          user_id: userId,
          role: 'admin',
          joined_at: '2024-01-05T00:00:00Z',
          tenants: {
            id: tenantId2,
            type: 'organization',
            name: 'Acme Corp',
            slug: 'acme-corp',
            org_number: '123456789',
            billing_email: 'billing@acme.com',
            settings: { theme: 'dark' },
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-05T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result).toHaveLength(2)

      // First tenant (household)
      expect(result[0]!.tenant.id).toBe(tenantId1)
      expect(result[0]!.tenant.type).toBe('household')
      expect(result[0]!.tenant.name).toBe('Smith Family')
      expect(result[0]!.tenant.slug).toBe('smith-family')
      expect(result[0]!.tenant.orgNumber).toBeNull()
      expect(result[0]!.tenant.billingEmail).toBeNull()
      expect(result[0]!.membership.id).toBe('membership-1')
      expect(result[0]!.membership.role).toBe('owner')
      expect(result[0]!.membership.joinedAt).toBeInstanceOf(Date)

      // Second tenant (organization)
      expect(result[1]!.tenant.id).toBe(tenantId2)
      expect(result[1]!.tenant.type).toBe('organization')
      expect(result[1]!.tenant.name).toBe('Acme Corp')
      expect(result[1]!.tenant.slug).toBe('acme-corp')
      expect(result[1]!.tenant.orgNumber).toBe('123456789')
      expect(result[1]!.tenant.billingEmail).toBe('billing@acme.com')
      expect(result[1]!.membership.id).toBe('membership-2')
      expect(result[1]!.membership.role).toBe('admin')
    })

    it('transforms snake_case database fields to camelCase', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId1,
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId1,
            type: 'organization',
            name: 'Test Org',
            slug: 'test-org',
            org_number: '999',
            billing_email: 'test@test.com',
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.tenant).toHaveProperty('orgNumber')
      expect(result[0]!.tenant).toHaveProperty('billingEmail')
      expect(result[0]!.tenant).toHaveProperty('createdAt')
      expect(result[0]!.tenant).toHaveProperty('updatedAt')
      expect(result[0]!.tenant).not.toHaveProperty('org_number')
      expect(result[0]!.tenant).not.toHaveProperty('billing_email')
      expect(result[0]!.tenant).not.toHaveProperty('created_at')
      expect(result[0]!.tenant).not.toHaveProperty('updated_at')

      expect(result[0]!.membership).toHaveProperty('tenantId')
      expect(result[0]!.membership).toHaveProperty('userId')
      expect(result[0]!.membership).toHaveProperty('joinedAt')
      expect(result[0]!.membership).not.toHaveProperty('tenant_id')
      expect(result[0]!.membership).not.toHaveProperty('user_id')
      expect(result[0]!.membership).not.toHaveProperty('joined_at')
    })

    it('converts date strings to Date objects', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId1,
          user_id: userId,
          role: 'member',
          joined_at: '2024-01-10T10:30:00Z',
          tenants: {
            id: tenantId1,
            type: 'household',
            name: 'Test',
            slug: 'test',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.tenant.createdAt).toBeInstanceOf(Date)
      expect(result[0]!.tenant.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(result[0]!.tenant.updatedAt).toBeInstanceOf(Date)
      expect(result[0]!.tenant.updatedAt.toISOString()).toBe('2024-01-15T12:00:00.000Z')
      expect(result[0]!.membership.joinedAt).toBeInstanceOf(Date)
      expect(result[0]!.membership.joinedAt.toISOString()).toBe('2024-01-10T10:30:00.000Z')
    })

    it('queries database with correct filters and ordering', async () => {
      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: [],
          error: null,
        })
      )

      await getUserTenants()

      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('tenants (')
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.order).toHaveBeenCalledWith('joined_at', { ascending: false })
    })
  })

  describe('data filtering', () => {
    const userId = 'user-123'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('filters out rows with null tenant data', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: 'tenant-456',
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: 'tenant-456',
            type: 'household',
            name: 'Valid Tenant',
            slug: 'valid-tenant',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 'membership-2',
          tenant_id: 'tenant-deleted',
          user_id: userId,
          role: 'admin',
          joined_at: '2024-01-02T00:00:00Z',
          tenants: null, // Tenant was deleted
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      // Should only return the valid tenant
      expect(result).toHaveLength(1)
      expect(result[0]!.tenant.name).toBe('Valid Tenant')
    })
  })

  describe('role types', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-456'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('correctly handles owner role', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId,
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId,
            type: 'household',
            name: 'Test',
            slug: 'test',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.membership.role).toBe('owner')
    })

    it('correctly handles admin role', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId,
          user_id: userId,
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId,
            type: 'household',
            name: 'Test',
            slug: 'test',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.membership.role).toBe('admin')
    })

    it('correctly handles member role', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId,
          user_id: userId,
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId,
            type: 'household',
            name: 'Test',
            slug: 'test',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.membership.role).toBe('member')
    })
  })

  describe('tenant types', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-456'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('correctly handles household type', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId,
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId,
            type: 'household',
            name: 'Household',
            slug: 'household',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.tenant.type).toBe('household')
    })

    it('correctly handles organization type', async () => {
      const mockData = [
        {
          id: 'membership-1',
          tenant_id: tenantId,
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z',
          tenants: {
            id: tenantId,
            type: 'organization',
            name: 'Organization',
            slug: 'organization',
            org_number: '123456789',
            billing_email: 'billing@org.com',
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.tenant.type).toBe('organization')
    })
  })

  describe('ordering', () => {
    const userId = 'user-123'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('returns tenants ordered by joined_at descending (newest first)', async () => {
      const mockData = [
        {
          id: 'membership-2',
          tenant_id: 'tenant-newer',
          user_id: userId,
          role: 'member',
          joined_at: '2024-02-01T00:00:00Z', // Newer
          tenants: {
            id: 'tenant-newer',
            type: 'household',
            name: 'Newer Tenant',
            slug: 'newer',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
          },
        },
        {
          id: 'membership-1',
          tenant_id: 'tenant-older',
          user_id: userId,
          role: 'owner',
          joined_at: '2024-01-01T00:00:00Z', // Older
          tenants: {
            id: 'tenant-older',
            type: 'household',
            name: 'Older Tenant',
            slug: 'older',
            org_number: null,
            billing_email: null,
            settings: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ]

      vi.mocked(mockSupabase.order).mockReturnValueOnce(
        Promise.resolve({
          data: mockData,
          error: null,
        })
      )

      const result = await getUserTenants()

      expect(result[0]!.tenant.name).toBe('Newer Tenant')
      expect(result[1]!.tenant.name).toBe('Older Tenant')
    })
  })
})
