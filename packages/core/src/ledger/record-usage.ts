import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@appdistillery/database'
import { RecordUsageInputSchema } from './types'
import type { RecordUsageInput, UsageEvent } from './types'

/**
 * Result type for recordUsage
 */
type RecordUsageResult =
  | { success: true; data: UsageEvent }
  | { success: false; error: string }

/**
 * Cached admin client instance (singleton pattern)
 */
let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Get or create Supabase admin client with service role access
 *
 * Uses singleton pattern to avoid creating multiple clients (5-20ms overhead per call).
 * Uses SUPABASE_SECRET_KEY (service role) to bypass RLS policies.
 * This is required for recordUsage since it's a service operation.
 */
function getAdminClient() {
  if (!cachedAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY required'
      )
    }

    cachedAdminClient = createClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return cachedAdminClient
}

/**
 * Reset the cached admin client (for testing only)
 * @internal
 */
export function __resetAdminClient() {
  cachedAdminClient = null
}

/**
 * Record a usage event in the usage_events table
 *
 * This function is called by Server Actions after AI operations to track
 * token usage, costs, and operational metrics. Uses service role to bypass
 * RLS policies since this is a system operation.
 *
 * @param input - Usage event data
 * @returns Result with created usage event or error
 *
 * @example
 * ```typescript
 * const result = await recordUsage({
 *   action: 'agency:scope:generate',
 *   tenantId: session.tenant?.id,
 *   userId: session.user.id,
 *   moduleId: 'agency',
 *   tokensInput: 1200,
 *   tokensOutput: 800,
 *   units: 50,
 *   durationMs: 2500,
 *   metadata: { leadId: 'lead-123' }
 * })
 *
 * if (!result.success) {
 *   console.error('Failed to record usage:', result.error)
 * }
 * ```
 */
export async function recordUsage(
  input: RecordUsageInput
): Promise<RecordUsageResult> {
  try {
    // 1. Validate input with Zod
    const validated = RecordUsageInputSchema.parse(input)

    // 2. Get admin client (singleton)
    const supabase = getAdminClient()

    // 3. Map camelCase to snake_case for database
    const { data, error } = await supabase
      .from('usage_events')
      .insert({
        action: validated.action,
        tenant_id: validated.tenantId ?? null,
        user_id: validated.userId ?? null,
        module_id: validated.moduleId ?? null,
        tokens_input: validated.tokensInput,
        tokens_output: validated.tokensOutput,
        units: validated.units,
        duration_ms: validated.durationMs ?? null,
        metadata: (validated.metadata ?? {}) as Json,
      })
      .select()
      .single()

    if (error) {
      console.error('[recordUsage] Database error:', error)
      return {
        success: false,
        error: `Failed to record usage: ${error.message}`,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to record usage: No data returned',
      }
    }

    // 4. Map snake_case back to camelCase for return
    const usageEvent: UsageEvent = {
      id: data.id,
      action: data.action,
      tenantId: data.tenant_id,
      userId: data.user_id,
      moduleId: data.module_id,
      tokensInput: data.tokens_input,
      tokensOutput: data.tokens_output,
      tokensTotal: data.tokens_total,
      units: data.units,
      durationMs: data.duration_ms,
      metadata: (data.metadata as Record<string, unknown>) ?? {},
      createdAt: data.created_at,
    }

    return { success: true, data: usageEvent }
  } catch (error) {
    // Handle validation errors or unexpected errors
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    console.error('[recordUsage] Error:', message)

    return {
      success: false,
      error: `Failed to record usage: ${message}`,
    }
  }
}
