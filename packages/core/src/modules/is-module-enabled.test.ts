import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isModuleEnabled } from './is-module-enabled'

// Mock Supabase server client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(),
}

vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

describe('isModuleEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when module is enabled for tenant', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(true)
  })

  it('returns false when module is disabled for tenant', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: false },
      error: null,
    })

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(false)
  })

  it('returns false when module is not installed for tenant', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(false)
  })

  it('returns false when no rows returned (PGRST116 error)', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    })

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(false)
  })

  it('returns false on database error', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'DB_ERROR', message: 'Database connection failed' },
    })

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(false)
  })

  it('returns false on unexpected error', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockRejectedValue(new Error('Unexpected error'))

    const result = await isModuleEnabled('tenant-123', 'agency')

    expect(result).toBe(false)
  })

  it('queries with both tenant_id and module_id filters', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    await isModuleEnabled('tenant-456', 'billing')

    expect(mockSupabase.from).toHaveBeenCalledWith('tenant_modules')
    expect(mockSupabase.select).toHaveBeenCalledWith('enabled')
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456')
    expect(mockSupabase.eq).toHaveBeenCalledWith('module_id', 'billing')
  })

  it('handles multiple module checks for same tenant', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle
      .mockResolvedValueOnce({
        data: { enabled: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { enabled: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: null,
      })

    const agencyEnabled = await isModuleEnabled('tenant-123', 'agency')
    const billingEnabled = await isModuleEnabled('tenant-123', 'billing')
    const marketingEnabled = await isModuleEnabled('tenant-123', 'marketing')

    expect(agencyEnabled).toBe(true)
    expect(billingEnabled).toBe(false)
    expect(marketingEnabled).toBe(false)
  })

  it('ensures tenant isolation', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    await isModuleEnabled('tenant-789', 'agency')

    // Verify tenant isolation
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-789')
  })
})
