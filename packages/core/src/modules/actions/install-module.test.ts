import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installModule } from './install-module'
import type { SessionContext } from '../../auth'

// Use vi.hoisted() for variables used in vi.mock() factory
const mockGetSessionContext = vi.hoisted(() => vi.fn())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase: Record<string, any> = vi.hoisted(() => ({
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(),
  single: vi.fn(),
}))

vi.mock('../../auth', () => ({
  getSessionContext: mockGetSessionContext,
}))

vi.mock('../../auth/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabase),
}))

const mockSession: SessionContext = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  tenant: {
    id: 'tenant-789',
    name: 'Test Tenant',
    type: 'organization',
    slug: 'test-tenant',
    orgNumber: null,
    billingEmail: null,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  membership: {
    id: 'membership-1',
    tenantId: 'tenant-789',
    userId: 'user-123',
    role: 'admin',
    joinedAt: new Date(),
  },
}

describe('installModule', () => {
  // Helper to restore Supabase mock chain after clearAllMocks
  const setupMockChain = () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionContext.mockResolvedValue(mockSession)
    setupMockChain()
  })

  describe('authorization', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetSessionContext.mockResolvedValueOnce(null)

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unauthorized')
      }
    })

    it('returns error when no active tenant', async () => {
      mockGetSessionContext.mockResolvedValueOnce({
        ...mockSession,
        tenant: null,
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('No active tenant')
      }
    })

    it('returns error when user is not admin or owner', async () => {
      mockGetSessionContext.mockResolvedValueOnce({
        ...mockSession,
        membership: { ...mockSession.membership!, role: 'member' },
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Forbidden: Admin access required')
      }
    })

    it('allows owner to install module', async () => {
      mockGetSessionContext.mockResolvedValueOnce({
        ...mockSession,
        membership: { ...mockSession.membership!, role: 'owner' },
      })

      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-1', module_id: 'agency' },
        error: null,
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
    })

    it('allows admin to install module', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-1', module_id: 'agency' },
        error: null,
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('input validation', () => {
    it('validates required moduleId field', async () => {
      const result = await installModule({
        moduleId: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Module ID is required')
      }
    })

    it('accepts valid input with moduleId only', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-1', module_id: 'agency' },
        error: null,
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
    })

    it('accepts valid input with moduleId and settings', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-1', module_id: 'agency' },
        error: null,
      })

      const result = await installModule({
        moduleId: 'agency',
        settings: { featureFlags: { proposals: true } },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('module validation', () => {
    it('returns error when module does not exist', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await installModule({
        moduleId: 'nonexistent',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module not found')
      }
    })

    it('returns error when module is not active', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'deprecated-module', is_active: false },
        error: null,
      })

      const result = await installModule({
        moduleId: 'deprecated-module',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module is not active')
      }
    })

    it('returns error when module lookup fails', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module not found')
      }
    })
  })

  describe('duplicate installation handling', () => {
    it('returns error when module is already installed and enabled', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'tm-1', enabled: true },
          error: null,
        })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module already installed')
      }
    })

    it('re-enables module when it is installed but disabled', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'tm-1', enabled: false },
          error: null,
        })
      const result = await installModule({
        moduleId: 'agency',
        settings: { newSettings: true },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('tm-1')
        expect(result.data.moduleId).toBe('agency')
      }

      // Verify update was called
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          settings: { newSettings: true },
        })
      )
    })

    it('returns error when re-enabling module fails', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'tm-1', enabled: false },
          error: null,
        })

      // Mock eq() for all queries:
      // Query 1 (module check): .eq('id', moduleId) - 1 call
      // Query 2 (existing check): .eq('tenant_id', ...).eq('module_id', ...) - 2 calls
      // Query 3 (update): .eq('id', existing.id) - 1 call
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase) // module check: eq('id', moduleId)
        .mockReturnValueOnce(mockSupabase) // existing check: eq('tenant_id', ...)
        .mockReturnValueOnce(mockSupabase) // existing check: eq('module_id', ...)
        .mockResolvedValueOnce({ // update: eq('id', existing.id) - return error
          data: null,
          error: { message: 'Update failed', code: 'DB_ERROR' },
        })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to re-enable module. Please try again.')
      }
    })
  })

  describe('successful installation', () => {
    it('installs module with default settings', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-new', module_id: 'agency' },
        error: null,
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('tm-new')
        expect(result.data.moduleId).toBe('agency')
      }

      // Verify insert was called with correct data
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tenant_id: 'tenant-789',
        module_id: 'agency',
        enabled: true,
        settings: {},
      })
    })

    it('installs module with custom settings', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-new', module_id: 'agency' },
        error: null,
      })

      const customSettings = {
        featureFlags: { proposals: true, briefs: false },
        theme: 'dark',
      }

      const result = await installModule({
        moduleId: 'agency',
        settings: customSettings,
      })

      expect(result.success).toBe(true)

      // Verify insert was called with custom settings
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tenant_id: 'tenant-789',
        module_id: 'agency',
        enabled: true,
        settings: customSettings,
      })
    })

    it('ensures tenant isolation in insert', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'tm-new', module_id: 'agency' },
        error: null,
      })

      await installModule({
        moduleId: 'agency',
      })

      // Verify tenant_id is included in insert
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-789',
        })
      )
    })

    it('returns error when installation fails', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 'agency', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed', code: 'DB_ERROR' },
      })

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to install module. Please try again.')
      }
    })
  })

  describe('error handling', () => {
    it('handles Zod validation errors', async () => {
      const result = await installModule({
        moduleId: 123, // Invalid type
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Expected string')
      }
    })

    it('handles unexpected errors', async () => {
      mockGetSessionContext.mockRejectedValueOnce(new Error('Unexpected'))

      const result = await installModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('An unexpected error occurred. Please try again.')
      }
    })
  })
})
