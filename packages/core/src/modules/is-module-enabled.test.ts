import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isModuleEnabled, clearModuleCache } from './is-module-enabled'

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
    // Clear cache before each test to ensure isolation
    clearModuleCache()
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

  it('caches result for subsequent calls with same tenant and module', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    // First call should hit database
    const result1 = await isModuleEnabled('tenant-cache-test', 'agency')
    expect(result1).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const result2 = await isModuleEnabled('tenant-cache-test', 'agency')
    expect(result2).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledTimes(1) // Still 1, not 2
  })

  it('does not cache across different tenants', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    // First call for tenant A
    await isModuleEnabled('tenant-A', 'agency')
    expect(mockSupabase.from).toHaveBeenCalledTimes(1)

    // Second call for tenant B should hit database
    await isModuleEnabled('tenant-B', 'agency')
    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })

  it('does not cache across different modules for same tenant', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { enabled: true },
      error: null,
    })

    // First call for module A
    await isModuleEnabled('tenant-X', 'agency')
    expect(mockSupabase.from).toHaveBeenCalledTimes(1)

    // Second call for module B should hit database
    await isModuleEnabled('tenant-X', 'billing')
    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })
})
