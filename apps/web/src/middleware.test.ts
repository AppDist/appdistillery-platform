import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from './middleware'
import type { User } from '@supabase/supabase-js'

// Mock the auth middleware
vi.mock('@appdistillery/core/auth', () => ({
  updateSession: vi.fn(),
}))

const { updateSession } = await import('@appdistillery/core/auth')

describe('middleware', () => {
  const mockSupabaseResponse = NextResponse.next()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('unauthenticated user', () => {
    beforeEach(() => {
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockSupabaseResponse,
        user: null,
      })
    })

    it('allows access to /login', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/login'))
      const response = await middleware(request)

      expect(response).toBe(mockSupabaseResponse)
    })

    it('allows access to /signup', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/signup'))
      const response = await middleware(request)

      expect(response).toBe(mockSupabaseResponse)
    })

    it('allows access to /auth/callback', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/auth/callback')
      )
      const response = await middleware(request)

      expect(response).toBe(mockSupabaseResponse)
    })

    it('redirects to /login for protected routes', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard')
      )
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login?redirect=%2Fdashboard'
      )
    })
  })

  describe('authenticated user', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }

    beforeEach(() => {
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockSupabaseResponse,
        user: mockUser,
      })
    })

    it('allows access to protected routes', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard')
      )
      const response = await middleware(request)

      expect(response).toBe(mockSupabaseResponse)
    })

    it('redirects /login to /dashboard', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/login'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      )
    })

    it('redirects /signup to /dashboard', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/signup'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      )
    })

    it('allows /auth/callback even when authenticated', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/auth/callback')
      )
      const response = await middleware(request)

      expect(response).toBe(mockSupabaseResponse)
    })
  })
})
