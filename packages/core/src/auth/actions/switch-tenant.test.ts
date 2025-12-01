import { describe, it, expect, vi, beforeEach } from 'vitest'
import { switchTenant } from './switch-tenant'

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

vi.mock('../supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

describe('switchTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authorization', () => {
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const result = await switchTenant({ tenantId: validUuid })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('accepts valid UUID tenant ID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'

      mockSupabase.single.mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      })

      const result = await switchTenant({ tenantId: validUuid })

      expect(result.success).toBe(true)
    })

    it('accepts null for personal mode', async () => {
      const result = await switchTenant({ tenantId: null })

      expect(result.success).toBe(true)
    })

    it('rejects invalid UUID', async () => {
      const result = await switchTenant({ tenantId: 'not-a-uuid' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid input')
      }
    })

    it('rejects non-string, non-null values', async () => {
      const result = await switchTenant({ tenantId: 123 })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid input')
      }
    })
  })

  describe('tenant membership validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('validates user is a member of the tenant', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000'

      mockSupabase.single.mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      })

      await switchTenant({ tenantId })

      // Verify membership query
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)
    })

    it('returns error if user is not a member', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      const result = await switchTenant({ tenantId })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('not a member')
      }
    })
  })

  describe('personal mode', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('sets empty cookie for personal mode', async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        set: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await switchTenant({ tenantId: null })

      expect(result.success).toBe(true)
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'active_tenant_id',
        '',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      )
    })

    it('does not validate membership for personal mode', async () => {
      await switchTenant({ tenantId: null })

      // Should not query tenant_members table
      expect(mockSupabase.from).not.toHaveBeenCalledWith('tenant_members')
    })
  })

  describe('cookie settings', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSupabase.single.mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      })
    })

    it('sets cookie with correct security settings', async () => {
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        set: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const tenantId = '123e4567-e89b-12d3-a456-426614174000'
      await switchTenant({ tenantId })

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'active_tenant_id',
        tenantId,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      )
    })

    it('sets secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        set: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const tenantId = '123e4567-e89b-12d3-a456-426614174000'
      await switchTenant({ tenantId })

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'active_tenant_id',
        tenantId,
        expect.objectContaining({
          secure: true,
        })
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})
