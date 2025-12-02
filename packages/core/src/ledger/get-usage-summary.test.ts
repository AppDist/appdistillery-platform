// @ts-nocheck - Test file with intentional type violations for testing validation
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUsageSummary } from './get-usage-summary'

// Mock Supabase client - need to properly chain the methods
const createMockQuery = () => {
  const mockQuery: any = {
    from: vi.fn(() => mockQuery),
    select: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    is: vi.fn(() => mockQuery),
    gte: vi.fn(() => mockQuery),
    // Add data/error that gets resolved by await
    then: vi.fn(),
  }
  return mockQuery
}

const mockSupabase = createMockQuery()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Test UUID
const TENANT_ID = 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab'

describe('getUsageSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock resolution
    mockSupabase.then.mockImplementation((resolve: any) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    })
  })

  describe('validation', () => {
    it('validates tenantId is required', async () => {
      const result = await getUsageSummary(
        // @ts-expect-error - Testing missing tenantId
        undefined,
        'day'
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('tenantId')
      }
    })

    it('validates tenantId is valid UUID or null', async () => {
      const result = await getUsageSummary(
        // @ts-expect-error - Testing invalid UUID
        'not-a-uuid',
        'day'
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('uuid')
      }
    })

    it('accepts null tenantId for Personal mode', async () => {
      const result = await getUsageSummary(null, 'day')

      expect(result.success).toBe(true)
      expect(mockSupabase.is).toHaveBeenCalledWith('tenant_id', null)
    })

    it('validates period is one of day/week/month', async () => {
      const result = await getUsageSummary(
        'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
        // @ts-expect-error - Testing invalid period
        'invalid'
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('period')
      }
    })
  })

  describe('date range calculation', () => {

    it('calculates start of today for day period', async () => {
      const now = new Date()
      const expectedStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      ).toISOString()

      await getUsageSummary(TENANT_ID, 'day')

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', expectedStart)
    })

    it('calculates start of this week for week period', async () => {
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day
      const expectedStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        diff,
        0,
        0,
        0,
        0
      ).toISOString()

      await getUsageSummary(TENANT_ID, 'week')

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', expectedStart)
    })

    it('calculates start of this month for month period', async () => {
      const now = new Date()
      const expectedStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      ).toISOString()

      await getUsageSummary(TENANT_ID, 'month')

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', expectedStart)
    })
  })

  describe('query building', () => {

    it('selects only required fields', async () => {
      await getUsageSummary(TENANT_ID, 'day')

      expect(mockSupabase.select).toHaveBeenCalledWith(
        'action, tokens_total, units'
      )
    })

    it('filters by tenantId', async () => {
      await getUsageSummary(TENANT_ID, 'day')

      expect(mockSupabase.from).toHaveBeenCalledWith('usage_events')
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', TENANT_ID)
    })

    it('filters by null tenantId for Personal mode', async () => {
      await getUsageSummary(null, 'day')

      expect(mockSupabase.is).toHaveBeenCalledWith('tenant_id', null)
    })
  })

  describe('aggregation', () => {
    it('aggregates total tokens and units', async () => {
      const mockData = [
        {
          action: 'agency:scope:generate',
          tokens_total: 1000,
          units: 50,
        },
        {
          action: 'agency:proposal:draft',
          tokens_total: 2000,
          units: 100,
        },
        {
          action: 'agency:scope:generate',
          tokens_total: 1500,
          units: 75,
        },
      ]

      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: mockData, error: null })
        return Promise.resolve({ data: mockData, error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalTokens).toBe(4500) // 1000 + 2000 + 1500
        expect(result.data.totalUnits).toBe(225) // 50 + 100 + 75
        expect(result.data.eventCount).toBe(3)
      }
    })

    it('aggregates usage by action', async () => {
      const mockData = [
        {
          action: 'agency:scope:generate',
          tokens_total: 1000,
          units: 50,
        },
        {
          action: 'agency:proposal:draft',
          tokens_total: 2000,
          units: 100,
        },
        {
          action: 'agency:scope:generate',
          tokens_total: 1500,
          units: 75,
        },
      ]

      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: mockData, error: null })
        return Promise.resolve({ data: mockData, error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.byAction).toHaveLength(2)

        // Should be sorted by tokens descending
        expect(result.data.byAction[0]).toEqual({
          action: 'agency:scope:generate',
          tokensTotal: 2500, // 1000 + 1500
          units: 125, // 50 + 75
          count: 2,
        })

        expect(result.data.byAction[1]).toEqual({
          action: 'agency:proposal:draft',
          tokensTotal: 2000,
          units: 100,
          count: 1,
        })
      }
    })

    it('sorts by action tokens descending', async () => {
      const mockData = [
        {
          action: 'agency:scope:generate',
          tokens_total: 1000,
          units: 50,
        },
        {
          action: 'agency:proposal:draft',
          tokens_total: 5000,
          units: 250,
        },
        {
          action: 'agency:brief:analyze',
          tokens_total: 3000,
          units: 150,
        },
      ]

      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: mockData, error: null })
        return Promise.resolve({ data: mockData, error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.byAction[0].action).toBe('agency:proposal:draft') // 5000
        expect(result.data.byAction[1].action).toBe('agency:brief:analyze') // 3000
        expect(result.data.byAction[2].action).toBe('agency:scope:generate') // 1000
      }
    })

    it('handles null tokens_total gracefully', async () => {
      const mockData = [
        {
          action: 'agency:scope:generate',
          tokens_total: null,
          units: 50,
        },
        {
          action: 'agency:proposal:draft',
          tokens_total: 2000,
          units: 100,
        },
      ]

      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: mockData, error: null })
        return Promise.resolve({ data: mockData, error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalTokens).toBe(2000)
        expect(result.data.totalUnits).toBe(150)
        expect(result.data.byAction[0].tokensTotal).toBe(2000)
        expect(result.data.byAction[1].tokensTotal).toBe(0)
      }
    })

    it('returns zero totals when no data', async () => {
      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: [], error: null })
        return Promise.resolve({ data: [], error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalTokens).toBe(0)
        expect(result.data.totalUnits).toBe(0)
        expect(result.data.eventCount).toBe(0)
        expect(result.data.byAction).toEqual([])
      }
    })
  })

  describe('error handling', () => {
    it('returns error when database query fails', async () => {
      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: null, error: { message: 'Connection error', code: 'PGRST000' } })
        return Promise.resolve({ data: null, error: { message: 'Connection error', code: 'PGRST000' } })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage summary')
      }
    })

    it('handles missing environment variables', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage summary')
      }

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('handles null data response', async () => {
      mockSupabase.then.mockImplementation((resolve: any) => {
        resolve({ data: null, error: null })
        return Promise.resolve({ data: null, error: null })
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage summary')
      }
    })
  })
})
