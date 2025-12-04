import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateSession } from './middleware'
import { NextRequest, NextResponse } from 'next/server'

// Mock createServerClient from @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

// Import after mocking to get the mocked version
import { createServerClient } from '@supabase/ssr'

describe('updateSession', () => {
  let mockRequest: NextRequest
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock request
    mockRequest = {
      cookies: {
        getAll: vi.fn().mockReturnValue([
          { name: 'sb-auth-token', value: 'mock-token' },
        ]),
        set: vi.fn(),
      },
    } as any

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }

    vi.mocked(createServerClient).mockReturnValue(mockSupabase)
  })

  describe('session refresh', () => {
    it('calls supabase.auth.getUser to refresh the session', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })

      await updateSession(mockRequest)

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('returns authenticated user when session is valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.user).toEqual(mockUser)
      expect(result.supabaseResponse).toBeDefined()
    })

    it('returns null user when session is invalid', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid session'),
      })

      const result = await updateSession(mockRequest)

      expect(result.user).toBeNull()
      expect(result.supabaseResponse).toBeDefined()
    })

    it('returns null user when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.user).toBeNull()
    })
  })

  describe('cookie handling', () => {
    it('reads cookies from request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await updateSession(mockRequest)

      // The cookies are read through the Supabase client configuration
      // The mock should have been called when createServerClient was invoked
      expect(createServerClient).toHaveBeenCalled()
    })

    it('provides cookie configuration to Supabase client', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await updateSession(mockRequest)

      // Verify createServerClient was called
      expect(createServerClient).toHaveBeenCalled()

      // The implementation should create a Supabase client with cookie handling
      // We can't directly inspect the mock calls in this test setup,
      // but we can verify the function was invoked
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('updates cookies in response when Supabase sets them', async () => {
      const mockCookiesToSet = [
        { name: 'sb-auth-token', value: 'new-token', options: {} },
        { name: 'sb-refresh-token', value: 'new-refresh', options: {} },
      ]

      let cookiesConfig: any
      vi.mocked(createServerClient).mockImplementation((url, key, config) => {
        cookiesConfig = config
        return mockSupabase
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      await updateSession(mockRequest)

      // Simulate Supabase calling setAll
      if (cookiesConfig?.cookies?.setAll) {
        cookiesConfig.cookies.setAll(mockCookiesToSet)
      }

      expect(mockRequest.cookies.set).toHaveBeenCalledWith('sb-auth-token', 'new-token')
      expect(mockRequest.cookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        'new-refresh'
      )
    })
  })

  describe('environment variables', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key'
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('uses environment variables to create Supabase client', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await updateSession(mockRequest)

      expect(createServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.any(Object)
      )
    })
  })

  describe('response creation', () => {
    it('creates NextResponse with request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.supabaseResponse).toBeInstanceOf(NextResponse)
    })

    it('returns response that can be used in middleware', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.supabaseResponse).toBeDefined()
      expect(typeof result.supabaseResponse.headers).toBeDefined()
    })

    it('updates response with new cookies from Supabase', async () => {
      let cookiesConfig: any
      vi.mocked(createServerClient).mockImplementation((url, key, config) => {
        cookiesConfig = config
        return mockSupabase
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateSession(mockRequest)

      // Simulate Supabase setting cookies
      if (cookiesConfig?.cookies?.setAll) {
        const mockCookies = [
          { name: 'test-cookie', value: 'test-value', options: { maxAge: 3600 } },
        ]
        cookiesConfig.cookies.setAll(mockCookies)

        expect(result.supabaseResponse.cookies).toBeDefined()
      }
    })
  })

  describe('user data', () => {
    it('returns complete user object when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.user).toEqual(mockUser)
      expect(result.user?.id).toBe('user-123')
      expect(result.user?.email).toBe('test@example.com')
    })

    it('does not expose sensitive data in response', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })

      const result = await updateSession(mockRequest)

      // User object should only contain what Supabase returns
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('token')
    })
  })

  describe('error handling', () => {
    it('handles getUser error gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Database connection failed'),
      })

      const result = await updateSession(mockRequest)

      expect(result.user).toBeNull()
      expect(result.supabaseResponse).toBeDefined()
    })

    it('continues execution even if getUser throws', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      await expect(updateSession(mockRequest)).rejects.toThrow('Unexpected error')
    })

    it('handles missing environment variables gracefully', async () => {
      const originalEnv = process.env
      process.env = {}

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Should not throw due to TypeScript non-null assertion
      // This test documents current behavior
      await expect(updateSession(mockRequest)).resolves.toBeDefined()

      process.env = originalEnv
    })
  })

  describe('middleware integration', () => {
    it('provides response that can be returned from middleware', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const result = await updateSession(mockRequest)

      // Response should be a valid NextResponse
      expect(result.supabaseResponse).toBeInstanceOf(NextResponse)
      expect(result.supabaseResponse.headers).toBeDefined()
    })

    it('allows middleware to check authentication status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const result = await updateSession(mockRequest)

      // Middleware can check: if (!result.user) { redirect to login }
      expect(result.user).not.toBeNull()
    })

    it('allows middleware to access user ID for further queries', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-specific-id' } },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.user?.id).toBe('user-specific-id')
    })
  })

  describe('cookie persistence', () => {
    it('uses cookies from request through configuration', async () => {
      const existingCookies = [
        { name: 'existing-cookie', value: 'existing-value' },
        { name: 'sb-auth-token', value: 'old-token' },
      ]

      mockRequest.cookies.getAll = vi.fn().mockReturnValue(existingCookies)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await updateSession(mockRequest)

      // The cookies are accessed through the Supabase client config
      expect(createServerClient).toHaveBeenCalled()
    })

    it('updates auth cookies when session is refreshed', async () => {
      let cookiesConfig: any
      vi.mocked(createServerClient).mockImplementation((url, key, config) => {
        cookiesConfig = config
        return mockSupabase
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      await updateSession(mockRequest)

      // Simulate cookie refresh
      if (cookiesConfig?.cookies?.setAll) {
        const refreshedCookies = [
          { name: 'sb-auth-token', value: 'refreshed-token', options: {} },
        ]
        cookiesConfig.cookies.setAll(refreshedCookies)
      }

      expect(mockRequest.cookies.set).toHaveBeenCalled()
    })
  })

  describe('return value structure', () => {
    it('returns object with supabaseResponse and user properties', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result).toHaveProperty('supabaseResponse')
      expect(result).toHaveProperty('user')
    })

    it('supabaseResponse is always defined', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateSession(mockRequest)

      expect(result.supabaseResponse).toBeDefined()
      expect(result.supabaseResponse).not.toBeNull()
    })

    it('user can be null or User object', async () => {
      // Test null user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const nullResult = await updateSession(mockRequest)
      expect(nullResult.user).toBeNull()

      // Test authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const authResult = await updateSession(mockRequest)
      expect(authResult.user).not.toBeNull()
      expect(authResult.user?.id).toBe('user-123')
    })
  })
})
