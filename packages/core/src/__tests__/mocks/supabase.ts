/**
 * Mock Supabase client for testing
 */

import type { Mock } from 'vitest'
import { vi } from 'vitest'

export interface MockSupabaseData {
  data: unknown
  error: null | { message: string; code: string }
}

export interface MockSupabaseClient {
  from: Mock
  auth: {
    getUser: Mock
    signInWithPassword: Mock
    signOut: Mock
  }
}

/**
 * Creates a mock Supabase client with configurable responses
 */
export function createMockSupabaseClient(defaultResponse?: MockSupabaseData): MockSupabaseClient {
  const mockResponse = defaultResponse ?? { data: null, error: null }

  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(mockResponse),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockResponse),
        }),
      }),
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(mockResponse),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(mockResponse),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockResponse),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(mockResponse),
    }),
  })

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }
}

/**
 * Test data factory for common entities
 */
export const testData = {
  organization: (overrides?: Partial<TestOrganization>): TestOrganization => ({
    id: 'test-org-id',
    name: 'Test Organization',
    slug: 'test-org',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  user: (overrides?: Partial<TestUser>): TestUser => ({
    id: 'test-user-id',
    email: 'test@example.com',
    org_id: 'test-org-id',
    role: 'member',
    ...overrides,
  }),

  usageEvent: (overrides?: Partial<TestUsageEvent>): TestUsageEvent => ({
    id: 'test-event-id',
    org_id: 'test-org-id',
    module_id: 'agency',
    action: 'agency:scope:generate',
    tokens: 1000,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
}

// Type definitions for test data
interface TestOrganization {
  id: string
  name: string
  slug: string
  created_at: string
}

interface TestUser {
  id: string
  email: string
  org_id: string
  role: string
}

interface TestUsageEvent {
  id: string
  org_id: string
  module_id: string
  action: string
  tokens: number
  created_at: string
}
