import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserSupabaseClient } from './supabase-browser'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url, key) => ({ url, key, type: 'browser' })),
}))

describe('createBrowserSupabaseClient', () => {
  beforeEach(() => {
    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
  })

  it('creates browser client with correct env vars', () => {
    const client = createBrowserSupabaseClient()

    expect(client).toBeDefined()
    expect(client).toMatchObject({
      url: 'https://test.supabase.co',
      key: 'test-publishable-key',
      type: 'browser',
    })
  })
})
