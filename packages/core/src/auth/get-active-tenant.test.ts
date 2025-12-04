import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActiveTenant } from './get-active-tenant'
import { ACTIVE_TENANT_COOKIE } from './constants'
import type { TenantRow } from './types'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}))

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

describe('getActiveTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('personal mode scenarios', () => {
    it('returns null when cookie is not set', async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith(ACTIVE_TENANT_COOKIE)
      // Should not attempt any Supabase queries
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()
    })

    it('returns null when cookie value is empty string', async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: '' }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith(ACTIVE_TENANT_COOKIE)
      // Should not attempt any Supabase queries
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()
    })
  })

  describe('authentication checks', () => {
    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi
          .fn()
          .mockReturnValue({ value: '123e4567-e89b-12d3-a456-426614174000' }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
    })

    it('returns null when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not query memberships if not authenticated
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('returns null when getUser returns no user object', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      // Should not query memberships if no user
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('membership validation', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const userId = 'user-456'

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
    })

    it('returns null when user is not a member of tenant', async () => {
      // Mock membership query - no membership found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)
      // Should not query tenants if membership invalid
      expect(mockSupabase.from).not.toHaveBeenCalledWith('tenants')
    })

    it('returns null when membership query returns error', async () => {
      // Mock membership query - database error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
      // Should not query tenants if membership check failed
      expect(mockSupabase.from).not.toHaveBeenCalledWith('tenants')
    })
  })

  describe('tenant lookup', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const userId = 'user-456'

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      // Mock valid membership
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'membership-1' },
        error: null,
      })
    })

    it('returns null when tenant does not exist', async () => {
      // Mock tenant query - tenant not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Tenant not found'),
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', tenantId)
    })

    it('returns null when tenant query returns error', async () => {
      // Mock tenant query - database error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database connection error'),
      })

      const result = await getActiveTenant()

      expect(result).toBeNull()
    })
  })

  describe('successful tenant retrieval', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const userId = 'user-456'

    const mockTenantRow: TenantRow = {
      id: tenantId,
      type: 'organization',
      name: 'AppDistillery',
      slug: 'appdistillery',
      org_number: '987654321',
      billing_email: 'billing@appdistillery.com',
      settings: { theme: 'dark' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    }

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      // Mock valid membership
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'membership-1' },
        error: null,
      })

      // Mock tenant found
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })
    })

    it('returns transformed tenant object when all checks pass', async () => {
      const result = await getActiveTenant()

      expect(result).not.toBeNull()
      expect(result).toEqual({
        id: tenantId,
        type: 'organization',
        name: 'AppDistillery',
        slug: 'appdistillery',
        orgNumber: '987654321',
        billingEmail: 'billing@appdistillery.com',
        settings: { theme: 'dark' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      })
    })

    it('transforms snake_case database fields to camelCase', async () => {
      const result = await getActiveTenant()

      expect(result).not.toBeNull()
      if (result) {
        // Verify camelCase transformation
        expect(result.orgNumber).toBe('987654321')
        expect(result.billingEmail).toBe('billing@appdistillery.com')
        expect(result.createdAt).toBeInstanceOf(Date)
        expect(result.updatedAt).toBeInstanceOf(Date)

        // Verify no snake_case properties
        expect('org_number' in result).toBe(false)
        expect('billing_email' in result).toBe(false)
        expect('created_at' in result).toBe(false)
        expect('updated_at' in result).toBe(false)
      }
    })

    it('queries database with correct filters for tenant lookup', async () => {
      await getActiveTenant()

      // Verify membership check
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)

      // Verify tenant fetch
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', tenantId)
    })
  })

  describe('error handling', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
    })

    it('returns null and logs error when unexpected exception occurs', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.auth.getUser.mockRejectedValue(
        new Error('Unexpected database failure')
      )

      const result = await getActiveTenant()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[getActiveTenant] Unexpected error',
        { error: expect.any(Error) }
      )

      consoleErrorSpy.mockRestore()
    })

    it('handles invalid tenant data gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      // Valid membership
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'membership-1' },
        error: null,
      })

      // Malformed tenant data that will cause transform to throw
      mockSupabase.single.mockResolvedValueOnce({
        data: null, // This will be caught as falsy and return null
        error: null,
      })

      const result = await getActiveTenant()

      // Should handle gracefully by returning null for falsy data
      expect(result).toBeNull()
    })
  })

  describe('userId parameter optimization', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'
    const userId = 'user-456'

    const mockTenantRow: TenantRow = {
      id: tenantId,
      type: 'organization',
      name: 'AppDistillery',
      slug: 'appdistillery',
      org_number: '987654321',
      billing_email: 'billing@appdistillery.com',
      settings: { theme: 'dark' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    }

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      // Mock valid membership
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'membership-1' },
        error: null,
      })

      // Mock tenant found
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })
    })

    it('skips getUser() call when userId is provided', async () => {
      const result = await getActiveTenant(userId)

      // Verify getUser was NOT called (optimization working)
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()

      // Verify membership check used provided userId
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)

      // Verify tenant was fetched successfully
      expect(result).not.toBeNull()
      expect(result?.id).toBe(tenantId)
    })

    it('calls getUser() when userId is not provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })

      const result = await getActiveTenant()

      // Verify getUser WAS called (backward compatibility)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()

      // Verify tenant was fetched successfully
      expect(result).not.toBeNull()
      expect(result?.id).toBe(tenantId)
    })
  })

  describe('console warnings', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'

    beforeEach(async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: tenantId }),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
    })

    it('logs warning when user is not authenticated', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await getActiveTenant()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[getActiveTenant] User not authenticated'
      )

      consoleWarnSpy.mockRestore()
    })

    it('logs warning when membership is not found', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      })

      await getActiveTenant()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[getActiveTenant] User no longer has membership to tenant:',
        tenantId
      )

      consoleWarnSpy.mockRestore()
    })

    it('logs warning when tenant is not found', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      })

      // Valid membership
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'membership-1' },
        error: null,
      })

      // Tenant not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      })

      await getActiveTenant()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[getActiveTenant] Tenant not found:',
        tenantId
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
