import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHousehold, createOrganization } from './create-tenant'
import type { TenantRow } from '../types'
import { ErrorCodes } from '../../utils/error-codes'

// Mock the createServerSupabaseClient module
vi.mock('../supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

// Import after mocking to get the mocked version
import { createServerSupabaseClient } from '../supabase-server'

describe('createHousehold', () => {
  // Mock Supabase client
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
    rpc: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as any
    )
  })

  describe('authentication', () => {
    it('returns error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error when auth.getUser returns null user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
      }
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('rejects name shorter than 2 characters', async () => {
      const result = await createHousehold({
        name: 'A',
        slug: 'valid-slug',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('at least 2 characters')
      }
    })

    it('rejects name longer than 50 characters', async () => {
      const result = await createHousehold({
        name: 'A'.repeat(51),
        slug: 'valid-slug',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('cannot exceed 50 characters')
      }
    })

    it('rejects slug shorter than 2 characters', async () => {
      const result = await createHousehold({
        name: 'Valid Name',
        slug: 'a',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('at least 2 characters')
      }
    })

    it('rejects slug longer than 30 characters', async () => {
      const result = await createHousehold({
        name: 'Valid Name',
        slug: 'a'.repeat(31),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('cannot exceed 30 characters')
      }
    })

    it('rejects slug with uppercase letters', async () => {
      const result = await createHousehold({
        name: 'Valid Name',
        slug: 'Smith-Family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('lowercase')
      }
    })

    it('rejects slug with spaces', async () => {
      const result = await createHousehold({
        name: 'Valid Name',
        slug: 'smith family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('lowercase')
      }
    })

    it('rejects slug with special characters', async () => {
      const result = await createHousehold({
        name: 'Valid Name',
        slug: 'smith_family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('lowercase')
      }
    })

    it('accepts valid slug with hyphens', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'household',
          name: 'Smith Family',
          slug: 'smith-family',
          org_number: null,
          billing_email: null,
          settings: {},
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
        error: null,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('duplicate slug handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('returns friendly error for duplicate slug', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-tenant-123' },
        error: null,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.SLUG_ALREADY_TAKEN)
        expect(result.error).toContain('smith-family')
        expect(result.error).toContain('already taken')
      }
    })
  })

  describe('successful household creation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      // No existing tenant
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
    })

    it('successfully creates a household tenant', async () => {
      const mockTenantRow: TenantRow = {
        id: 'tenant-123',
        type: 'household',
        name: 'Smith Family',
        slug: 'smith-family',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('tenant-123')
        expect(result.data.type).toBe('household')
        expect(result.data.name).toBe('Smith Family')
        expect(result.data.slug).toBe('smith-family')
        expect(result.data.orgNumber).toBeNull()
        expect(result.data.billingEmail).toBeNull()
      }
    })

    it('calls database function with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'household',
          name: 'Smith Family',
          slug: 'smith-family',
          org_number: null,
          billing_email: null,
          settings: {},
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
        error: null,
      })

      await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_tenant_with_owner',
        {
          p_type: 'household',
          p_name: 'Smith Family',
          p_slug: 'smith-family',
        }
      )
    })

    it('transforms snake_case database row to camelCase', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'household',
          name: 'Test',
          slug: 'test',
          org_number: null,
          billing_email: null,
          settings: { theme: 'dark' },
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T01:00:00Z',
        },
        error: null,
      })

      const result = await createHousehold({
        name: 'Test',
        slug: 'test',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('orgNumber')
        expect(result.data).toHaveProperty('billingEmail')
        expect(result.data).toHaveProperty('createdAt')
        expect(result.data).toHaveProperty('updatedAt')
        expect(result.data).not.toHaveProperty('org_number')
        expect(result.data).not.toHaveProperty('billing_email')
        expect(result.data.createdAt).toBeInstanceOf(Date)
        expect(result.data.updatedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
    })

    it('handles database RPC error gracefully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' } as any,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.TENANT_CREATION_FAILED)
      }
    })

    it('handles fetch error after creation', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Fetch error' } as any,
      })

      const result = await createHousehold({
        name: 'Smith Family',
        slug: 'smith-family',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.TENANT_NOT_FOUND)
        expect(result.error).toContain('created but failed to retrieve')
      }
    })
  })
})

describe('createOrganization', () => {
  // Mock Supabase client
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
    rpc: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as any
    )
  })

  describe('authentication', () => {
    it('returns error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error when auth.getUser returns null user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
      }
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('rejects name shorter than 2 characters', async () => {
      const result = await createOrganization({
        name: 'A',
        slug: 'valid-slug',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('at least 2 characters')
      }
    })

    it('rejects name longer than 100 characters', async () => {
      const result = await createOrganization({
        name: 'A'.repeat(101),
        slug: 'valid-slug',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('cannot exceed 100 characters')
      }
    })

    it('rejects invalid billingEmail format', async () => {
      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        billingEmail: 'invalid-email',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid email')
      }
    })

    it('accepts valid billingEmail', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'organization',
          name: 'Acme Corp',
          slug: 'acme-corp',
          org_number: null,
          billing_email: 'billing@acme.com',
          settings: {},
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        billingEmail: 'billing@acme.com',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('optional fields', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
    })

    it('creates organization without orgNumber', async () => {
      const mockTenantRow: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Acme Corp',
        slug: 'acme-corp',
        org_number: null,
        billing_email: null,
        settings: {},
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.orgNumber).toBeNull()
      }
    })

    it('creates organization with orgNumber', async () => {
      const mockTenantRow: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Acme Corp',
        slug: 'acme-corp',
        org_number: '123456789',
        billing_email: null,
        settings: {},
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        orgNumber: '123456789',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.orgNumber).toBe('123456789')
      }
    })

    it('creates organization with billingEmail', async () => {
      const mockTenantRow: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Acme Corp',
        slug: 'acme-corp',
        org_number: null,
        billing_email: 'billing@acme.com',
        settings: {},
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        billingEmail: 'billing@acme.com',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.billingEmail).toBe('billing@acme.com')
      }
    })

    it('includes optional fields in RPC call when provided', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'organization',
          name: 'Acme Corp',
          slug: 'acme-corp',
          org_number: '123456789',
          billing_email: 'billing@acme.com',
          settings: {},
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
        error: null,
      })

      await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        orgNumber: '123456789',
        billingEmail: 'billing@acme.com',
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_tenant_with_owner',
        expect.objectContaining({
          p_type: 'organization',
          p_name: 'Acme Corp',
          p_slug: 'acme-corp',
          p_org_number: '123456789',
          p_billing_email: 'billing@acme.com',
        })
      )
    })
  })

  describe('duplicate slug handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('returns friendly error for duplicate slug', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-tenant-123' },
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.SLUG_ALREADY_TAKEN)
        expect(result.error).toContain('acme-corp')
        expect(result.error).toContain('already taken')
      }
    })
  })

  describe('successful organization creation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
    })

    it('successfully creates an organization tenant', async () => {
      const mockTenantRow: TenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Acme Corp',
        slug: 'acme-corp',
        org_number: '123456789',
        billing_email: 'billing@acme.com',
        settings: {},
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTenantRow,
        error: null,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
        orgNumber: '123456789',
        billingEmail: 'billing@acme.com',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('tenant-123')
        expect(result.data.type).toBe('organization')
        expect(result.data.name).toBe('Acme Corp')
        expect(result.data.slug).toBe('acme-corp')
        expect(result.data.orgNumber).toBe('123456789')
        expect(result.data.billingEmail).toBe('billing@acme.com')
      }
    })

    it('calls database function with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'organization',
          name: 'Acme Corp',
          slug: 'acme-corp',
          org_number: null,
          billing_email: null,
          settings: {},
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
        error: null,
      })

      await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_tenant_with_owner',
        {
          p_type: 'organization',
          p_name: 'Acme Corp',
          p_slug: 'acme-corp',
        }
      )
    })

    it('transforms snake_case database row to camelCase', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'tenant-123',
          type: 'organization',
          name: 'Test Org',
          slug: 'test-org',
          org_number: '999',
          billing_email: 'test@test.com',
          settings: { color: 'blue' },
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T01:00:00Z',
        },
        error: null,
      })

      const result = await createOrganization({
        name: 'Test Org',
        slug: 'test-org',
        orgNumber: '999',
        billingEmail: 'test@test.com',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('orgNumber')
        expect(result.data).toHaveProperty('billingEmail')
        expect(result.data).toHaveProperty('createdAt')
        expect(result.data).toHaveProperty('updatedAt')
        expect(result.data).not.toHaveProperty('org_number')
        expect(result.data).not.toHaveProperty('billing_email')
        expect(result.data.createdAt).toBeInstanceOf(Date)
        expect(result.data.updatedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })
    })

    it('handles database RPC error gracefully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' } as any,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.TENANT_CREATION_FAILED)
      }
    })

    it('handles fetch error after creation', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'tenant-123',
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Fetch error' } as any,
      })

      const result = await createOrganization({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe(ErrorCodes.TENANT_NOT_FOUND)
        expect(result.error).toContain('created but failed to retrieve')
      }
    })
  })
})
