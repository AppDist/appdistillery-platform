// @ts-nocheck - Test file with intentional type violations for testing validation
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUsageSummary } from './get-usage-summary'

// Mock Supabase client with RPC support
const mockSupabase: any = {
  rpc: vi.fn(),
}

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
    // Setup default mock RPC response (empty result)
    mockSupabase.rpc.mockResolvedValue({
      data: {
        totalTokens: 0,
        totalUnits: 0,
        eventCount: 0,
        byAction: [],
      },
      error: null,
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
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_tenant_id: null })
      )
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

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_start_date: expectedStart })
      )
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

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_start_date: expectedStart })
      )
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

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_start_date: expectedStart })
      )
    })
  })

  describe('RPC function calls', () => {

    it('calls get_usage_summary RPC with correct parameters', async () => {
      await getUsageSummary(TENANT_ID, 'day')

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({
          p_tenant_id: TENANT_ID,
          p_start_date: expect.any(String),
        })
      )
    })

    it('calls RPC with tenant_id for tenant mode', async () => {
      await getUsageSummary(TENANT_ID, 'day')

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_tenant_id: TENANT_ID })
      )
    })

    it('calls RPC with null tenant_id for Personal mode', async () => {
      await getUsageSummary(null, 'day')

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_usage_summary',
        expect.objectContaining({ p_tenant_id: null })
      )
    })
  })

  describe('aggregation', () => {
    it('returns aggregated totals from RPC', async () => {
      // RPC returns already-aggregated data from PostgreSQL
      mockSupabase.rpc.mockResolvedValue({
        data: {
          totalTokens: 4500,
          totalUnits: 225,
          eventCount: 3,
          byAction: [
            {
              action: 'agency:scope:generate',
              tokensTotal: 2500,
              units: 125,
              count: 2,
            },
            {
              action: 'agency:proposal:draft',
              tokensTotal: 2000,
              units: 100,
              count: 1,
            },
          ],
        },
        error: null,
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalTokens).toBe(4500)
        expect(result.data.totalUnits).toBe(225)
        expect(result.data.eventCount).toBe(3)
      }
    })

    it('returns usage breakdown by action from RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          totalTokens: 4500,
          totalUnits: 225,
          eventCount: 3,
          byAction: [
            {
              action: 'agency:scope:generate',
              tokensTotal: 2500,
              units: 125,
              count: 2,
            },
            {
              action: 'agency:proposal:draft',
              tokensTotal: 2000,
              units: 100,
              count: 1,
            },
          ],
        },
        error: null,
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.byAction).toHaveLength(2)

        // RPC returns data already sorted by tokens descending
        expect(result.data.byAction[0]).toEqual({
          action: 'agency:scope:generate',
          tokensTotal: 2500,
          units: 125,
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

    it('returns data sorted by tokens descending from RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          totalTokens: 9000,
          totalUnits: 450,
          eventCount: 3,
          byAction: [
            {
              action: 'agency:proposal:draft',
              tokensTotal: 5000,
              units: 250,
              count: 1,
            },
            {
              action: 'agency:brief:analyze',
              tokensTotal: 3000,
              units: 150,
              count: 1,
            },
            {
              action: 'agency:scope:generate',
              tokensTotal: 1000,
              units: 50,
              count: 1,
            },
          ],
        },
        error: null,
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.byAction[0].action).toBe('agency:proposal:draft') // 5000
        expect(result.data.byAction[1].action).toBe('agency:brief:analyze') // 3000
        expect(result.data.byAction[2].action).toBe('agency:scope:generate') // 1000
      }
    })

    it('returns zero totals when no data', async () => {
      // RPC returns zero totals when no events match
      mockSupabase.rpc.mockResolvedValue({
        data: {
          totalTokens: 0,
          totalUnits: 0,
          eventCount: 0,
          byAction: [],
        },
        error: null,
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
    it('returns error when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection error', code: 'PGRST000' },
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

    it('handles null data response from RPC', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getUsageSummary(TENANT_ID, 'day')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage summary')
      }
    })
  })
})
