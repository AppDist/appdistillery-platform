// @ts-nocheck - Test file with intentional type violations for testing validation
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUsageHistory } from './get-usage-history'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  is: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Test UUIDs
const TENANT_ID = 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab'
const USER_ID = 'b0f86e3d-9c4b-4e5a-8b7f-1234567890ab'

describe('getUsageHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validation', () => {
    it('validates tenantId is required', async () => {
      const result = await getUsageHistory({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing missing tenantId
        userId: 'user-123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('tenantId')
      }
    })

    it('validates tenantId is valid UUID or null', async () => {
      const result = await getUsageHistory({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing invalid UUID
        tenantId: 'not-a-uuid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('uuid')
      }
    })

    it('accepts null tenantId for Personal mode', async () => {
      mockSupabase.is.mockReturnValue({
        ...mockSupabase,
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      })

      const result = await getUsageHistory({
        tenantId: null,
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.is).toHaveBeenCalledWith('tenant_id', null)
    })

    it('validates userId is UUID if provided', async () => {
      const result = await getUsageHistory({
        tenantId: 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing invalid UUID
        userId: 'not-a-uuid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('uuid')
      }
    })

    it('validates startDate is ISO 8601 if provided', async () => {
      const result = await getUsageHistory({
        tenantId: 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing invalid date
        startDate: 'not-a-date',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('datetime')
      }
    })

    it('validates limit is positive and max 1000', async () => {
      const result = await getUsageHistory({
        tenantId: 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
        limit: 1001,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Number must be less than or equal to')
      }
    })

    it('validates offset is non-negative', async () => {
      const result = await getUsageHistory({
        tenantId: 'a0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
        offset: -1,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Number must be greater than or equal to')
      }
    })
  })

  describe('query building', () => {
    beforeEach(() => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })
    })

    it('filters by tenantId', async () => {
      await getUsageHistory({ tenantId: TENANT_ID })

      expect(mockSupabase.from).toHaveBeenCalledWith('usage_events')
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', TENANT_ID)
    })

    it('filters by null tenantId for Personal mode', async () => {
      await getUsageHistory({ tenantId: null })

      expect(mockSupabase.is).toHaveBeenCalledWith('tenant_id', null)
    })

    it('applies userId filter when provided', async () => {
      await getUsageHistory({
        tenantId: TENANT_ID,
        userId: USER_ID,
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', USER_ID)
    })

    it('applies action filter when provided', async () => {
      const action = 'agency:scope:generate'

      await getUsageHistory({
        tenantId: TENANT_ID,
        action,
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('action', action)
    })

    it('applies moduleId filter when provided', async () => {
      const moduleId = 'agency'

      await getUsageHistory({
        tenantId: TENANT_ID,
        moduleId,
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('module_id', moduleId)
    })

    it('applies startDate filter when provided', async () => {
      const startDate = '2025-01-01T00:00:00Z'

      await getUsageHistory({
        tenantId: TENANT_ID,
        startDate,
      })

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate)
    })

    it('applies endDate filter when provided', async () => {
      const endDate = '2025-01-31T23:59:59Z'

      await getUsageHistory({
        tenantId: TENANT_ID,
        endDate,
      })

      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', endDate)
    })

    it('applies pagination with limit and offset', async () => {
      const limit = 50
      const offset = 100

      await getUsageHistory({
        tenantId: TENANT_ID,
        limit,
        offset,
      })

      expect(mockSupabase.range).toHaveBeenCalledWith(100, 149) // offset to offset + limit - 1
    })

    it('orders by created_at descending', async () => {
      await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      })
    })

    it('requests exact count for pagination', async () => {
      await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' })
    })
  })

  describe('data mapping', () => {
    it('maps snake_case database fields to camelCase', async () => {
      const mockData = [
        {
          id: 'c0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
          action: 'agency:scope:generate',
          tenant_id: TENANT_ID,
          user_id: USER_ID,
          module_id: 'agency',
          tokens_input: 1200,
          tokens_output: 800,
          tokens_total: 2000,
          units: 50,
          duration_ms: 2500,
          metadata: { leadId: 'lead-123' },
          created_at: '2025-01-15T10:00:00Z',
        },
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      })

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toEqual({
          id: 'c0f86e3d-9c4b-4e5a-8b7f-1234567890ab',
          action: 'agency:scope:generate',
          tenantId: TENANT_ID,
          userId: USER_ID,
          moduleId: 'agency',
          tokensInput: 1200,
          tokensOutput: 800,
          tokensTotal: 2000,
          units: 50,
          durationMs: 2500,
          metadata: { leadId: 'lead-123' },
          createdAt: '2025-01-15T10:00:00Z',
        })
      }
    })

    it('returns count for pagination', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 42,
      })

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.count).toBe(42)
      }
    })

    it('returns empty array when no data', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([])
        expect(result.count).toBe(0)
      }
    })
  })

  describe('error handling', () => {
    it('returns error when database query fails', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Connection error', code: 'PGRST000' },
        count: null,
      })

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage history')
      }
    })

    it('handles missing environment variables', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage history')
      }

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('handles null data response', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      })

      const result = await getUsageHistory({
        tenantId: TENANT_ID,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to retrieve usage history')
      }
    })
  })
})
