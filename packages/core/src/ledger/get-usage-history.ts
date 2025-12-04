import { z } from 'zod'
import { createAuthClient } from './supabase-client'
import {
  UsageHistoryOptionsSchema,
  UsageEventSchema,
  type UsageHistoryOptions,
  type UsageEvent,
} from './types'
import { logger } from '../utils/logger'

/**
 * Result type for getUsageHistory
 */
type GetUsageHistoryResult =
  | { success: true; data: UsageEvent[]; count: number }
  | { success: false; error: string }

/**
 * Retrieve usage history with filtering and pagination
 *
 * Queries usage_events table with optional filters for:
 * - Date range (startDate, endDate)
 * - Action pattern
 * - Module ID
 * - User ID
 *
 * Supports pagination via limit and offset.
 * Returns total count for pagination metadata.
 *
 * @param options - Query options with filters and pagination
 * @returns Result with usage events array and total count, or error
 *
 * @example
 * ```typescript
 * // Get recent usage for tenant
 * const result = await getUsageHistory({
 *   tenantId: 'tenant-123',
 *   limit: 50,
 *   offset: 0
 * })
 *
 * // Filter by action and date range
 * const filtered = await getUsageHistory({
 *   tenantId: 'tenant-123',
 *   action: 'agency:scope:generate',
 *   startDate: '2025-01-01T00:00:00Z',
 *   endDate: '2025-01-31T23:59:59Z'
 * })
 *
 * // Personal mode (no tenant)
 * const personal = await getUsageHistory({
 *   tenantId: null,
 *   userId: 'user-456'
 * })
 * ```
 *
 * ## Query Performance Analysis
 *
 * **Index Usage (depends on filters):**
 * - `idx_usage_events_tenant_created (tenant_id, created_at DESC)` - Primary index for tenant queries
 * - `idx_usage_events_action (action)` - Used when filtering by action
 * - `idx_usage_events_user_id (user_id)` - Used for Personal mode queries
 * - `idx_usage_events_module_id (module_id)` - Used when filtering by module
 *
 * **EXPLAIN ANALYZE (typical tenant query with pagination):**
 * ```sql
 * -- Expected plan for tenant_id + ORDER BY created_at DESC + LIMIT
 * Limit  (cost=xxx..xxx rows=50)
 *   -> Index Scan Backward using idx_usage_events_tenant_created on usage_events
 *        Index Cond: (tenant_id = 'uuid')
 * ```
 *
 * **Performance Considerations:**
 * - COUNT(*) with `count: 'exact'` requires full index scan for accurate count
 * - For very large datasets (100K+ events), consider removing exact count or using estimate
 * - RLS uses `user_is_tenant_member()` SECURITY DEFINER function to avoid recursion
 * - Pagination via OFFSET is efficient for reasonable page depths (<1000 pages)
 *
 * **Potential Optimization (if count becomes bottleneck):**
 * - Replace `{ count: 'exact' }` with `{ count: 'estimated' }` for faster response
 * - Or remove count entirely and use cursor-based pagination
 */
export async function getUsageHistory(
  options: UsageHistoryOptions
): Promise<GetUsageHistoryResult> {
  // 1. Validate input with Zod (validation errors are safe to expose to user)
  let validated: z.infer<typeof UsageHistoryOptionsSchema>
  try {
    validated = UsageHistoryOptionsSchema.parse(options)
  } catch (error) {
    // Validation errors from Zod describe user input, safe to expose
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    logger.error('getUsageHistory', 'Validation error', { message })
    return {
      success: false,
      error: message,
    }
  }

  try {

    // 2. Create authenticated client (respects RLS)
    const supabase = createAuthClient()

    // 3. Build query with filters
    let query = supabase
      .from('usage_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply tenant filter (REQUIRED - null for Personal mode)
    if (validated.tenantId === null) {
      query = query.is('tenant_id', null)
    } else {
      query = query.eq('tenant_id', validated.tenantId)
    }

    // Apply optional filters
    if (validated.userId) {
      query = query.eq('user_id', validated.userId)
    }

    if (validated.action) {
      query = query.eq('action', validated.action)
    }

    if (validated.moduleId) {
      query = query.eq('module_id', validated.moduleId)
    }

    if (validated.startDate) {
      query = query.gte('created_at', validated.startDate)
    }

    if (validated.endDate) {
      query = query.lte('created_at', validated.endDate)
    }

    // Apply pagination
    const from = validated.offset
    const to = validated.offset + validated.limit - 1
    query = query.range(from, to)

    // 4. Execute query
    const { data, error, count } = await query

    if (error) {
      logger.error('getUsageHistory', 'Database error', { error })
      return {
        success: false,
        error: 'Failed to retrieve usage history',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to retrieve usage history',
      }
    }

    // 5. Map snake_case to camelCase
    const usageEvents: UsageEvent[] = data.map((row) => ({
      id: row.id,
      action: row.action,
      tenantId: row.tenant_id,
      userId: row.user_id,
      moduleId: row.module_id,
      tokensInput: row.tokens_input,
      tokensOutput: row.tokens_output,
      tokensTotal: row.tokens_total,
      units: row.units,
      durationMs: row.duration_ms,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.created_at,
    }))

    // 6. Validate mapped data with Zod (ensures type safety)
    const validatedEvents = usageEvents.map((event) =>
      UsageEventSchema.parse(event)
    )

    return {
      success: true,
      data: validatedEvents,
      count: count ?? 0,
    }
  } catch (error) {
    // Handle unexpected runtime errors (database, env, etc.)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    logger.error('getUsageHistory', 'Runtime error', { message })

    return {
      success: false,
      error: 'Failed to retrieve usage history',
    }
  }
}
