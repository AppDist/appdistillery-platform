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

    // 4. Build query with date filter
    let query = supabase
      .from('usage_events')
      .select('action, tokens_total, units')
      .gte('created_at', startDate)

    // Apply tenant filter (REQUIRED - null for Personal mode)
    if (validated.tenantId === null) {
      query = query.is('tenant_id', null)
    } else {
      query = query.eq('tenant_id', validated.tenantId)
    }

    // 5. Execute query
    const { data, error } = await query

    if (error) {
      console.error('[getUsageSummary] Database error:', error)
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

    // 6. Aggregate results
    let totalTokens = 0
    let totalUnits = 0
    const eventCount = data.length
    const actionMap = new Map<
      string,
      { tokensTotal: number; units: number; count: number }
    >()

    for (const row of data) {
      // Aggregate totals
      totalTokens += row.tokens_total ?? 0
      totalUnits += row.units

      // Aggregate by action
      const action = row.action
      const existing = actionMap.get(action) ?? {
        tokensTotal: 0,
        units: 0,
        count: 0,
      }

      actionMap.set(action, {
        tokensTotal: existing.tokensTotal + (row.tokens_total ?? 0),
        units: existing.units + row.units,
        count: existing.count + 1,
      })
    }

    // 7. Convert map to array
    const byAction: UsageByAction[] = Array.from(actionMap.entries()).map(
      ([action, stats]) => ({
        action,
        tokensTotal: stats.tokensTotal,
        units: stats.units,
        count: stats.count,
      })
    )

    // Sort by token usage (descending)
    byAction.sort((a, b) => b.tokensTotal - a.tokensTotal)

    // 8. Build summary
    const summary: UsageSummary = {
      totalTokens,
      totalUnits,
      eventCount,
      byAction,
    }

    // 9. Validate with Zod
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
