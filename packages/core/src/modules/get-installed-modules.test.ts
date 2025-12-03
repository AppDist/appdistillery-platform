import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getInstalledModules } from './get-installed-modules'

// Mock Supabase server client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase: Record<string, any> = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
}

vi.mock('../auth/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

describe('getInstalledModules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when tenant has no modules installed', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await getInstalledModules('tenant-123')

    expect(result).toEqual([])
  })

  it('returns installed enabled modules for tenant', async () => {
    const mockData = [
      {
        id: 'tm-1',
        tenant_id: 'tenant-123',
        module_id: 'agency',
        enabled: true,
        settings: { featureFlags: { proposals: true } },
        installed_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        module: {
          id: 'agency',
          name: 'Agency',
          description: 'Consultancy tools',
          version: '1.0.0',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: mockData,
      error: null,
    })

    const result = await getInstalledModules('tenant-123')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'tm-1',
      tenantId: 'tenant-123',
      moduleId: 'agency',
      enabled: true,
      settings: { featureFlags: { proposals: true } },
      installedAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2025-01-15T10:00:00Z'),
      module: {
        id: 'agency',
        name: 'Agency',
        description: 'Consultancy tools',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    })
  })

  it('filters by enabled status by default', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    await getInstalledModules('tenant-123')

    // Verify tenant_id filter
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
    // Verify enabled filter by default
    expect(mockSupabase.eq).toHaveBeenCalledWith('enabled', true)
  })

  it('includes disabled modules when includeDisabled option is true', async () => {
    const mockData = [
      {
        id: 'tm-1',
        tenant_id: 'tenant-123',
        module_id: 'agency',
        enabled: true,
        settings: {},
        installed_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        module: {
          id: 'agency',
          name: 'Agency',
          description: 'Consultancy tools',
          version: '1.0.0',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      },
      {
        id: 'tm-2',
        tenant_id: 'tenant-123',
        module_id: 'billing',
        enabled: false,
        settings: {},
        installed_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z',
        module: {
          id: 'billing',
          name: 'Billing',
          description: 'Billing module',
          version: '1.0.0',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: mockData,
      error: null,
    })

    const result = await getInstalledModules('tenant-123', {
      includeDisabled: true,
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.enabled).toBe(true)
    expect(result[1]!.enabled).toBe(false)

    // Should NOT filter by enabled status when includeDisabled is true
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
    expect(mockSupabase.eq).not.toHaveBeenCalledWith('enabled', expect.anything())
  })

  it('orders results by installation date descending', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    await getInstalledModules('tenant-123')

    expect(mockSupabase.order).toHaveBeenCalledWith('installed_at', {
      ascending: false,
    })
  })

  it('transforms snake_case to camelCase', async () => {
    const mockData = [
      {
        id: 'tm-1',
        tenant_id: 'tenant-123',
        module_id: 'agency',
        enabled: true,
        settings: null,
        installed_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        module: {
          id: 'agency',
          name: 'Agency',
          description: 'Consultancy tools',
          version: '1.0.0',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: mockData,
      error: null,
    })

    const result = await getInstalledModules('tenant-123')

    expect(result[0]).toHaveProperty('tenantId')
    expect(result[0]).toHaveProperty('moduleId')
    expect(result[0]).toHaveProperty('installedAt')
    expect(result[0]).toHaveProperty('updatedAt')
    expect(result[0]!.module).toHaveProperty('isActive')
    expect(result[0]!.module).toHaveProperty('createdAt')
  })

  it('handles null settings gracefully', async () => {
    const mockData = [
      {
        id: 'tm-1',
        tenant_id: 'tenant-123',
        module_id: 'agency',
        enabled: true,
        settings: null,
        installed_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        module: {
          id: 'agency',
          name: 'Agency',
          description: 'Consultancy tools',
          version: '1.0.0',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: mockData,
      error: null,
    })

    const result = await getInstalledModules('tenant-123')

    expect(result[0]!.settings).toEqual({})
  })

  it('throws error on database error', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed', code: 'DB_ERROR' },
    })

    await expect(getInstalledModules('tenant-123')).rejects.toThrow(
      'Failed to fetch installed modules: Database connection failed'
    )
  })

  it('handles null data gracefully', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await getInstalledModules('tenant-123')

    expect(result).toEqual([])
  })

  it('ensures tenant isolation by filtering by tenant_id', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    await getInstalledModules('tenant-456')

    expect(mockSupabase.from).toHaveBeenCalledWith('tenant_modules')
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456')
  })
})
