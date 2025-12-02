import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordUsage } from './record-usage'

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'usage-123',
                action: 'agency:scope:generate',
                tenant_id: 'tenant-456',
                user_id: 'user-789',
                module_id: 'agency',
                tokens_input: 1200,
                tokens_output: 800,
                tokens_total: 2000,
                units: 50,
                duration_ms: 2500,
                metadata: { leadId: 'lead-123' },
                created_at: '2025-01-15T10:00:00Z',
              },
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
}))

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SECRET_KEY = 'test-secret-key'

describe('recordUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records usage event successfully', async () => {
    const result = await recordUsage({
      action: 'agency:scope:generate',
      tenantId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      moduleId: 'agency',
      tokensInput: 1200,
      tokensOutput: 800,
      units: 50,
      durationMs: 2500,
      metadata: { leadId: 'lead-123' },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('usage-123')
      expect(result.data.action).toBe('agency:scope:generate')
      expect(result.data.tenantId).toBe('tenant-456')
      expect(result.data.tokensInput).toBe(1200)
      expect(result.data.tokensOutput).toBe(800)
    }
  })

  it('handles null tenantId for Personal mode', async () => {
    const result = await recordUsage({
      action: 'agency:scope:generate',
      tenantId: null,
      userId: '223e4567-e89b-12d3-a456-426614174000',
      moduleId: 'agency',
      tokensInput: 1200,
      tokensOutput: 800,
      units: 50,
    })

    expect(result.success).toBe(true)
  })

  it('validates required action field', async () => {
    const result = await recordUsage({
      action: '',
      tokensInput: 100,
      tokensOutput: 50,
      units: 10,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Action is required')
    }
  })

  it('validates action format (module:domain:verb)', async () => {
    const invalidFormats = [
      'invalid',
      'invalid:format',
      'invalid:format:verb:extra',
      'Invalid:Format:Verb', // uppercase not allowed
      'agency:scope-generate', // missing colon
      'agency::generate', // empty domain
    ]

    for (const action of invalidFormats) {
      const result = await recordUsage({
        action,
        tokensInput: 100,
        tokensOutput: 50,
        units: 10,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Action must be in format module:domain:verb')
      }
    }
  })

  it('applies default values for tokens and units', async () => {
    const result = await recordUsage({
      action: 'agency:scope:generate',
    })

    expect(result.success).toBe(true)
  })

  it('handles database errors gracefully', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Database error', code: 'DB_ERROR' },
              })
            ),
          })),
        })),
      })),
    } as any)

    const result = await recordUsage({
      action: 'agency:scope:generate',
      tokensInput: 100,
      tokensOutput: 50,
      units: 10,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Database error')
    }
  })
})
