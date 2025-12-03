import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uninstallModule } from './uninstall-module'
import type { SessionContext } from '../../auth'

// Use vi.hoisted() for variables used in vi.mock() factory
const mockGetSessionContext = vi.hoisted(() => vi.fn())
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(),
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
    createdAt: new Date(),
  },
  membership: {
    id: 'membership-1',
    tenantId: 'tenant-789',
    userId: 'user-123',
    role: 'admin',
    joinedAt: new Date(),
  },
}

describe('uninstallModule', () => {
  // Helper to restore Supabase mock chain after clearAllMocks
  const setupMockChain = () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionContext.mockResolvedValue(mockSession)
    setupMockChain()
  })

  describe('authorization', () => {
    it('returns error when user is not authenticated', async () => {
      mockGetSessionContext.mockResolvedValueOnce(null)

      const result = await uninstallModule({
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

      const result = await uninstallModule({
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

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Forbidden: Admin access required')
      }
    })

    it('allows owner to uninstall module', async () => {
      mockGetSessionContext.mockResolvedValueOnce({
        ...mockSession,
        membership: { ...mockSession.membership!, role: 'owner' },
      })

      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
    })

    it('allows admin to uninstall module', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('input validation', () => {
    it('validates required moduleId field', async () => {
      const result = await uninstallModule({
        moduleId: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Module ID is required')
      }
    })

    it('accepts valid input with moduleId only (soft delete default)', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hardDeleted).toBe(false)
      }
    })

    it('accepts hardDelete flag', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
        hardDelete: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hardDeleted).toBe(true)
      }
    })
  })

  describe('module existence validation', () => {
    it('returns error when module is not installed', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'nonexistent',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module not installed')
      }
    })

    it('returns error when module lookup fails', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module not installed')
      }
    })
  })

  describe('soft delete (disable)', () => {
    it('disables module when hardDelete is false', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
        hardDelete: false,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.moduleId).toBe('agency')
        expect(result.data.hardDeleted).toBe(false)
      }

      // Verify update was called
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'tm-1')
    })

    it('returns error when module is already disabled', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: false },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Module already disabled')
      }

      // Should not call update
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })

    it('returns error when disable fails', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      // Mock eq() to return error for the update operation
      // First two eq() calls are for checking existence (return mockSupabase)
      // Third eq() call is for the update operation (return error)
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase) // tenant_id check
        .mockReturnValueOnce(mockSupabase) // module_id check
        .mockResolvedValueOnce({ // update .eq('id', existing.id)
          data: null,
          error: { message: 'Update failed', code: 'DB_ERROR' },
        })

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to disable module. Please try again.')
      }
    })

    it('updates timestamp when disabling', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      await uninstallModule({
        moduleId: 'agency',
      })

      // Verify updated_at is included
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
          updated_at: expect.any(String),
        })
      )
    })
  })

  describe('hard delete', () => {
    it('deletes tenant_modules record when hardDelete is true', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
        hardDelete: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.moduleId).toBe('agency')
        expect(result.data.hardDeleted).toBe(true)
      }

      // Verify delete was called
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'tm-1')
    })

    it('hard deletes module even if already disabled', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: false },
        error: null,
      })

      const result = await uninstallModule({
        moduleId: 'agency',
        hardDelete: true,
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('returns error when hard delete fails', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      // Mock eq() to return error for the delete operation
      // First two eq() calls are for checking existence (return mockSupabase)
      // Third eq() call is for the delete operation (return error)
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase) // tenant_id check
        .mockReturnValueOnce(mockSupabase) // module_id check
        .mockResolvedValueOnce({ // delete .eq('id', existing.id)
          data: null,
          error: { message: 'Delete failed', code: 'DB_ERROR' },
        })

      const result = await uninstallModule({
        moduleId: 'agency',
        hardDelete: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to uninstall module. Please try again.')
      }
    })
  })

  describe('tenant isolation', () => {
    it('ensures tenant isolation when checking module existence', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'tm-1', enabled: true },
        error: null,
      })

      await uninstallModule({
        moduleId: 'agency',
      })

      // Verify tenant_id filter (called three times: tenant_id, module_id, then id for update)
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_modules')
      const eqCalls = mockSupabase.eq.mock.calls
      // First two eq calls are for the existence check query
      expect(eqCalls[0]).toEqual(['tenant_id', 'tenant-789'])
      expect(eqCalls[1]).toEqual(['module_id', 'agency'])
      // Third eq call is for the update operation
      expect(eqCalls[2]).toEqual(['id', 'tm-1'])
    })
  })

  describe('error handling', () => {
    it('handles Zod validation errors', async () => {
      const result = await uninstallModule({
        moduleId: 123, // Invalid type
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Expected string')
      }
    })

    it('handles unexpected errors', async () => {
      mockGetSessionContext.mockRejectedValueOnce(new Error('Unexpected'))

      const result = await uninstallModule({
        moduleId: 'agency',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('An unexpected error occurred. Please try again.')
      }
    })
  })
})
