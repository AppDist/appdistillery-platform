import { createAuthClient } from './supabase-client'
import {
  PeriodSchema,
  UsageSummarySchema,
  type Period,
  type UsageSummary,
  type UsageByAction,
} from './types'
import { z } from 'zod'

/**
 * Result type for getUsageSummary
 */
type GetUsageSummaryResult =
  | { success: true; data: UsageSummary }
  | { success: false; error: string }

/**
 * Input schema for getUsageSummary
 */
const GetUsageSummaryInputSchema = z.object({
  tenantId: z.string().uuid().nullable(),
  period: PeriodSchema,
})

type GetUsageSummaryInput = z.infer<typeof GetUsageSummaryInputSchema>

/**
 * Calculate start date based on period
 */
function getStartDateForPeriod(period: Period): string {
  const now = new Date()

  switch (period) {
    case 'day':
      // Start of today
      now.setHours(0, 0, 0, 0)
      break
    case 'week':
      // Start of this week (Sunday)
      const day = now.getDay()
      const diff = now.getDate() - day
      now.setDate(diff)
      now.setHours(0, 0, 0, 0)
      break
    case 'month':
      // Start of this month
      now.setDate(1)
      now.setHours(0, 0, 0, 0)
      break
  }

  return now.toISOString()
}

/**
 * Retrieve aggregated usage summary for a time period
 *
 * Calculates:
 * - Total tokens consumed
 * - Total Brain Units consumed
 * - Total number of events
 * - Breakdown by action (tokens, units, count per action)
 *
 * @param tenantId - Tenant ID (null for Personal mode)
 * @param period - Time period: 'day', 'week', or 'month'
 * @returns Result with usage summary or error
 *
 * @example
 * ```typescript
 * // Get today's usage for tenant
 * const result = await getUsageSummary('tenant-123', 'day')
 * if (result.success) {
 *   console.log('Total tokens:', result.data.totalTokens)
 *   console.log('Total units:', result.data.totalUnits)
 *   console.log('Events:', result.data.eventCount)
 *   console.log('By action:', result.data.byAction)
 * }
 *
 * // Get this month's usage for personal mode
 * const personal = await getUsageSummary(null, 'month')
 * ```
 */
export async function getUsageSummary(
  tenantId: string | null,
  period: Period
): Promise<GetUsageSummaryResult> {
  // 1. Validate input with Zod (validation errors are safe to expose to user)
  let validated: GetUsageSummaryInput
  try {
    validated = GetUsageSummaryInputSchema.parse({ tenantId, period })
  } catch (error) {
    // Validation errors from Zod describe user input, safe to expose
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[getUsageSummary] Validation error:', message)
    return {
      success: false,
      error: message,
    }
  }

  try {

    // 2. Calculate date range
    const startDate = getStartDateForPeriod(validated.period)

    // 3. Create authenticated client (respects RLS)
    const supabase = createAuthClient()

    // 4. Call server-side aggregation RPC function
    // This replaces O(n) row transfer + JavaScript aggregation
    // with O(1) aggregated result from PostgreSQL
    const { data, error } = await supabase.rpc('get_usage_summary', {
      p_tenant_id: validated.tenantId,
      p_start_date: startDate,
    })

    if (error) {
      console.error('[getUsageSummary] RPC error:', error)
      return {
        success: false,
        error: 'Failed to retrieve usage summary',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to retrieve usage summary',
      }
    }

    // 5. Parse RPC result (already aggregated server-side)
    // Note: Type assertion needed until db:generate runs after migration
    const rpcResult = data as unknown as {
      totalTokens: number
      totalUnits: number
      eventCount: number
      byAction: Array<{
        action: string
        tokensTotal: number
        units: number
        count: number
      }>
    }

    const summary: UsageSummary = {
      totalTokens: rpcResult.totalTokens,
      totalUnits: rpcResult.totalUnits,
      eventCount: rpcResult.eventCount,
      byAction: rpcResult.byAction,
    }

    // 6. Validate with Zod
    const validatedSummary = UsageSummarySchema.parse(summary)

    return { success: true, data: validatedSummary }
  } catch (error) {
    // Handle unexpected runtime errors (database, env, etc.)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    console.error('[getUsageSummary] Runtime error:', message)

    return {
      success: false,
      error: 'Failed to retrieve usage summary',
    }
  }
}
