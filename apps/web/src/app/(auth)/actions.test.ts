import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signOut } from './actions'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase client
const mockSignOut = vi.fn()
vi.mock('@appdistillery/core/auth', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}))

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    try {
      await signOut()
    } catch (error) {
      // Expect redirect error
      expect(error).toEqual(new Error('REDIRECT:/login'))
    }

    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('redirects to login page after sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    await expect(signOut()).rejects.toThrow('REDIRECT:/login')
  })

  it('throws error if Supabase signOut fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } })

    await expect(signOut()).rejects.toThrow('Failed to sign out')
  })
})
