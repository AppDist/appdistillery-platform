import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSessionContext } from './index'
import type { UserProfileRow, TenantMemberRow } from './types'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
}

vi.mock('./supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

// Mock getActiveTenant
const mockGetActiveTenant = vi.fn()
vi.mock('./get-active-tenant', () => ({
  getActiveTenant: () => mockGetActiveTenant(),
}))

describe('getSessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('returns null when user is not authenticated (auth error)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const result = await getSessionContext()

      expect(result).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not attempt profile fetch if not authenticated
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('returns null when user object is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getSessionContext()

      expect(result).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not attempt profile fetch if no user
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('user profile fetching', () => {
    const userId = 'user-123'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('returns null when profile fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Profile not found'),
      })

      const result = await getSessionContext()

      expect(result).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getSessionContext] Failed to fetch user profile',
        { error: expect.any(Error) }
      )

      consoleErrorSpy.mockRestore()
    })

    it('returns null when profile data is missing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getSessionContext] Failed to fetch user profile',
        { error: null }
      )

      consoleErrorSpy.mockRestore()
    })

    it('transforms snake_case profile fields to camelCase', async () => {
      const mockProfileRow: UserProfileRow = {
        id: userId,
        display_name: 'John Doe',
        email: 'john@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      // No active tenant
      mockGetActiveTenant.mockResolvedValueOnce(null)

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result) {
        expect(result.user.id).toBe(userId)
        expect(result.user.displayName).toBe('John Doe')
        expect(result.user.email).toBe('john@example.com')
        expect(result.user.avatarUrl).toBe('https://example.com/avatar.jpg')
        expect(result.user.createdAt).toBeInstanceOf(Date)
        expect(result.user.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
        expect(result.user.updatedAt).toBeInstanceOf(Date)
        expect(result.user.updatedAt.toISOString()).toBe('2024-01-15T12:00:00.000Z')
      }
    })
  })

  describe('personal mode (no active tenant)', () => {
    const userId = 'user-123'
    const mockProfileRow: UserProfileRow = {
      id: userId,
      display_name: 'Personal User',
      email: 'personal@example.com',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })
    })

    it('returns user profile with null tenant when no active tenant', async () => {
      mockGetActiveTenant.mockResolvedValueOnce(null)

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      expect(result).toEqual({
        user: {
          id: userId,
          displayName: 'Personal User',
          email: 'personal@example.com',
          avatarUrl: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        tenant: null,
        membership: null,
      })
    })

    it('does not query memberships when no active tenant', async () => {
      mockGetActiveTenant.mockResolvedValueOnce(null)

      await getSessionContext()

      // Should only query user_profiles, not tenant_members
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSupabase.from).not.toHaveBeenCalledWith('tenant_members')
    })
  })

  describe('tenant mode (active tenant selected)', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-456'

    const mockProfileRow: UserProfileRow = {
      id: userId,
      display_name: 'Tenant User',
      email: 'tenant@example.com',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const mockTenant = {
      id: tenantId,
      type: 'organization' as const,
      name: 'AppDistillery',
      slug: 'appdistillery',
      orgNumber: '987654321',
      billingEmail: 'billing@example.com',
      settings: {},
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      // Profile fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValue(mockTenant)
    })

    it('returns user profile with tenant and membership when active tenant exists', async () => {
      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-789',
        tenant_id: tenantId,
        user_id: userId,
        role: 'admin',
        joined_at: '2024-01-05T10:00:00Z',
      }

      // Membership fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      expect(result).toEqual({
        user: {
          id: userId,
          displayName: 'Tenant User',
          email: 'tenant@example.com',
          avatarUrl: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        tenant: mockTenant,
        membership: {
          id: 'membership-789',
          tenantId: tenantId,
          userId: userId,
          role: 'admin',
          joinedAt: new Date('2024-01-05T10:00:00Z'),
        },
      })
    })

    it('transforms snake_case membership fields to camelCase', async () => {
      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-789',
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result && result.membership) {
        expect(result.membership.tenantId).toBe(tenantId)
        expect(result.membership.userId).toBe(userId)
        expect(result.membership.joinedAt).toBeInstanceOf(Date)
        expect(result.membership.joinedAt.toISOString()).toBe('2024-01-05T10:00:00.000Z')
      }
    })

    it('queries membership with correct user_id and tenant_id filters', async () => {
      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-789',
        tenant_id: tenantId,
        user_id: userId,
        role: 'member',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      await getSessionContext()

      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.select).toHaveBeenCalledWith('id, tenant_id, user_id, role, joined_at')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)
    })
  })

  describe('membership fetch error handling', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-456'

    const mockProfileRow: UserProfileRow = {
      id: userId,
      display_name: 'Test User',
      email: 'test@example.com',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const mockTenant = {
      id: tenantId,
      type: 'organization' as const,
      name: 'Test Org',
      slug: 'test-org',
      orgNumber: null,
      billingEmail: null,
      settings: {},
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValue(mockTenant)
    })

    it('falls back to personal mode when membership fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Membership not found'),
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      expect(result).toEqual({
        user: {
          id: userId,
          displayName: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        tenant: null,
        membership: null,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getSessionContext] Failed to fetch membership',
        { error: expect.any(Error) }
      )

      consoleErrorSpy.mockRestore()
    })

    it('falls back to personal mode when membership data is missing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result) {
        expect(result.tenant).toBeNull()
        expect(result.membership).toBeNull()
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getSessionContext] Failed to fetch membership',
        { error: null }
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getActiveTenant error handling', () => {
    const userId = 'user-123'

    const mockProfileRow: UserProfileRow = {
      id: userId,
      display_name: 'Test User',
      email: 'test@example.com',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })
    })

    it('falls back to personal mode when getActiveTenant throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockGetActiveTenant.mockRejectedValueOnce(new Error('Database connection error'))

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      expect(result).toEqual({
        user: {
          id: userId,
          displayName: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        tenant: null,
        membership: null,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getSessionContext] Failed to get active tenant',
        { error: expect.any(Error) }
      )

      consoleErrorSpy.mockRestore()
    })

    it('gracefully handles unexpected errors during tenant fetch', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockGetActiveTenant.mockRejectedValueOnce(new TypeError('Unexpected error'))

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result) {
        expect(result.tenant).toBeNull()
        expect(result.membership).toBeNull()
      }

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('type safety and discriminated unions', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-456'

    const mockProfileRow: UserProfileRow = {
      id: userId,
      display_name: 'Type Safety User',
      email: 'type@example.com',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const mockTenant = {
      id: tenantId,
      type: 'household' as const,
      name: 'Test Household',
      slug: 'test-household',
      orgNumber: null,
      billingEmail: null,
      settings: {},
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    }

    it('correctly handles owner role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValue(mockTenant)

      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-owner',
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result && result.membership) {
        expect(result.membership.role).toBe('owner')
      }
    })

    it('correctly handles admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValue(mockTenant)

      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-admin',
        tenant_id: tenantId,
        user_id: userId,
        role: 'admin',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result && result.membership) {
        expect(result.membership.role).toBe('admin')
      }
    })

    it('correctly handles member role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValue(mockTenant)

      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-member',
        tenant_id: tenantId,
        user_id: userId,
        role: 'member',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result && result.membership) {
        expect(result.membership.role).toBe('member')
      }
    })

    it('correctly handles both tenant types (household, organization)', async () => {
      const types: Array<'household' | 'organization'> = ['household', 'organization']

      for (const type of types) {
        vi.clearAllMocks()

        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        })

        mockSupabase.single.mockResolvedValueOnce({
          data: mockProfileRow,
          error: null,
        })

        const tenant = { ...mockTenant, type }

        mockGetActiveTenant.mockResolvedValue(tenant)

        const mockMembershipRow: TenantMemberRow = {
          id: 'membership-123',
          tenant_id: tenantId,
          user_id: userId,
          role: 'member',
          joined_at: '2024-01-05T10:00:00Z',
        }

        mockSupabase.single.mockResolvedValueOnce({
          data: mockMembershipRow,
          error: null,
        })

        const result = await getSessionContext()

        expect(result).not.toBeNull()
        if (result && result.tenant) {
          expect(result.tenant.type).toBe(type)
        }
      }
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('handles null display_name in profile', async () => {
      const userId = 'user-null-name'
      const mockProfileRow: UserProfileRow = {
        id: userId,
        display_name: null,
        email: 'no-name@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValueOnce(null)

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result) {
        expect(result.user.displayName).toBeNull()
      }
    })

    it('handles null avatar_url in profile', async () => {
      const userId = 'user-null-avatar'
      const mockProfileRow: UserProfileRow = {
        id: userId,
        display_name: 'User',
        email: 'user@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      mockGetActiveTenant.mockResolvedValueOnce(null)

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result) {
        expect(result.user.avatarUrl).toBeNull()
      }
    })

    it('handles tenant with minimal optional fields', async () => {
      const userId = 'user-123'
      const tenantId = 'tenant-456'

      const mockProfileRow: UserProfileRow = {
        id: userId,
        display_name: 'User',
        email: 'user@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfileRow,
        error: null,
      })

      const mockTenant = {
        id: tenantId,
        type: 'household' as const,
        name: 'Minimal Household',
        slug: 'minimal',
        orgNumber: null,
        billingEmail: null,
        settings: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      }

      mockGetActiveTenant.mockResolvedValue(mockTenant)

      const mockMembershipRow: TenantMemberRow = {
        id: 'membership-123',
        tenant_id: tenantId,
        user_id: userId,
        role: 'member',
        joined_at: '2024-01-05T10:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMembershipRow,
        error: null,
      })

      const result = await getSessionContext()

      expect(result).not.toBeNull()
      if (result && result.tenant) {
        expect(result.tenant.orgNumber).toBeNull()
        expect(result.tenant.billingEmail).toBeNull()
      }
    })
  })
})
