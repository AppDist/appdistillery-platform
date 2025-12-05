import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  transformUserProfileRow,
  fetchUserProfile,
  getAuthenticatedUserId,
  isSlugTaken,
  fetchTenantMembership,
  createTenantWithOwner,
  fetchTenant,
} from './helpers'
import type { UserProfileRow } from './types'

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

vi.mock('./supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('transformUserProfileRow', () => {
    it('converts snake_case to camelCase', () => {
      const row: UserProfileRow = {
        id: 'user-123',
        display_name: 'John Doe',
        email: 'john@example.com',
        avatar_url: 'https://example.com/avatar.png',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      }

      const result = transformUserProfileRow(row)

      expect(result).toHaveProperty('displayName')
      expect(result).toHaveProperty('avatarUrl')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      expect(result).not.toHaveProperty('display_name')
      expect(result).not.toHaveProperty('avatar_url')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('updated_at')
    })

    it('transforms date strings to Date objects', () => {
      const row: UserProfileRow = {
        id: 'user-123',
        display_name: 'John Doe',
        email: 'john@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:30:45Z',
      }

      const result = transformUserProfileRow(row)

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.updatedAt.toISOString()).toBe('2024-01-15T12:30:45.000Z')
    })

    it('preserves all field values correctly', () => {
      const row: UserProfileRow = {
        id: 'user-456',
        display_name: 'Jane Smith',
        email: 'jane@example.com',
        avatar_url: 'https://cdn.example.com/jane.jpg',
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-02-15T14:30:00Z',
      }

      const result = transformUserProfileRow(row)

      expect(result.id).toBe('user-456')
      expect(result.displayName).toBe('Jane Smith')
      expect(result.email).toBe('jane@example.com')
      expect(result.avatarUrl).toBe('https://cdn.example.com/jane.jpg')
    })

    it('handles null avatar_url', () => {
      const row: UserProfileRow = {
        id: 'user-789',
        display_name: 'No Avatar',
        email: 'noavatar@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transformUserProfileRow(row)

      expect(result.avatarUrl).toBeNull()
    })
  })

  describe('fetchUserProfile', () => {
    it('returns profile when found', async () => {
      const profileRow: UserProfileRow = {
        id: 'user-123',
        display_name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: profileRow,
        error: null,
      })

      const result = await fetchUserProfile('user-123')

      expect(result.profile).not.toBeNull()
      expect(result.profile?.id).toBe('user-123')
      expect(result.profile?.displayName).toBe('Test User')
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('returns null with error when not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const result = await fetchUserProfile('nonexistent-user')

      expect(result.profile).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('returns null with error on database failure', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' },
      })

      const result = await fetchUserProfile('user-123')

      expect(result.profile).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('getAuthenticatedUserId', () => {
    it('returns user ID when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-authenticated' } },
        error: null,
      })

      const result = await getAuthenticatedUserId()

      expect(result).toBe('user-authenticated')
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('returns null when not authenticated (auth error)', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const result = await getAuthenticatedUserId()

      expect(result).toBeNull()
    })

    it('returns null when user object is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await getAuthenticatedUserId()

      expect(result).toBeNull()
    })
  })

  describe('isSlugTaken', () => {
    it('returns true when slug exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-tenant' },
        error: null,
      })

      const result = await isSlugTaken('existing-slug')

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'existing-slug')
    })

    it('returns false when slug is available', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const result = await isSlugTaken('available-slug')

      expect(result).toBe(false)
    })

    it('returns false when data is null', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await isSlugTaken('no-data-slug')

      expect(result).toBe(false)
    })
  })

  describe('fetchTenantMembership', () => {
    // Note: These tests verify the function signature and error handling.
    // Full integration tests with real Supabase are in the integration test suite.

    it('calls Supabase with correct table and filters', async () => {
      // Setup mock for query chain
      // Type-justified: Supabase mock chains require flexible typing
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })
      const eqMock2 = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValueOnce({ select: selectMock } as any)

      await fetchTenantMembership('user-123', 'tenant-456')

      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members')
    })

    it('returns membership when found', async () => {
      const membershipRow = {
        id: 'member-789',
        tenant_id: 'tenant-456',
        user_id: 'user-123',
        role: 'admin',
        joined_at: '2024-01-10T00:00:00Z',
      }

      // Setup mock for query chain
      // Type-justified: Supabase mock chains require flexible typing
      const singleMock = vi.fn().mockResolvedValue({
        data: membershipRow,
        error: null,
      })
      const eqMock2 = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValueOnce({ select: selectMock } as any)

      const result = await fetchTenantMembership('user-123', 'tenant-456')

      expect(result.membership).not.toBeNull()
      expect(result.membership?.id).toBe('member-789')
      expect(result.membership?.role).toBe('admin')
      expect(result.membership?.tenantId).toBe('tenant-456')
      expect(result.membership?.userId).toBe('user-123')
      expect(result.error).toBeNull()
    })

    it('returns null with error when not found', async () => {
      // Setup mock for query chain
      // Type-justified: Supabase mock chains require flexible typing
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })
      const eqMock2 = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValueOnce({ select: selectMock } as any)

      const result = await fetchTenantMembership('user-999', 'tenant-888')

      expect(result.membership).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('createTenantWithOwner', () => {
    it('calls RPC with correct parameters for organization', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'new-tenant-id',
        error: null,
      })

      const result = await createTenantWithOwner(
        'organization',
        'Acme Corp',
        'acme-corp',
        '123456789',
        'billing@acme.com'
      )

      expect(result).toBe('new-tenant-id')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_tenant_with_owner', expect.objectContaining({
        p_type: 'organization',
        p_name: 'Acme Corp',
        p_slug: 'acme-corp',
        p_org_number: '123456789',
        p_billing_email: 'billing@acme.com',
      }))
    })

    it('calls RPC with correct parameters for household', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'household-tenant-id',
        error: null,
      })

      const result = await createTenantWithOwner(
        'household',
        'Smith Family',
        'smith-family'
      )

      expect(result).toBe('household-tenant-id')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_tenant_with_owner', {
        p_type: 'household',
        p_name: 'Smith Family',
        p_slug: 'smith-family',
      })
    })

    it('returns tenant ID on success', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'success-tenant-id',
        error: null,
      })

      const result = await createTenantWithOwner('household', 'Test', 'test')

      expect(result).toBe('success-tenant-id')
    })

    it('returns null on error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed', code: '500' },
      })

      const result = await createTenantWithOwner('organization', 'Test', 'test')

      expect(result).toBeNull()
    })
  })

  describe('fetchTenant', () => {
    it('returns tenant when found', async () => {
      const tenantRow = {
        id: 'tenant-123',
        type: 'organization',
        name: 'Test Org',
        slug: 'test-org',
        org_number: '123456789',
        billing_email: 'billing@test.com',
        settings: { theme: 'dark' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: tenantRow,
        error: null,
      })

      const result = await fetchTenant('tenant-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('tenant-123')
      expect(result?.name).toBe('Test Org')
      expect(result?.orgNumber).toBe('123456789')
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'tenant-123')
    })

    it('returns null when not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const result = await fetchTenant('nonexistent-tenant')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' },
      })

      const result = await fetchTenant('tenant-123')

      expect(result).toBeNull()
    })
  })
})
