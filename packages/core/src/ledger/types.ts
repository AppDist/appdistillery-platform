import { z } from 'zod'

/**
 * Input schema for recording usage events
 *
 * Validates all required fields before inserting into usage_events table.
 * tenant_id is optional to support Personal mode (users without active tenant).
 */
export const RecordUsageInputSchema = z.object({
  /**
   * Action identifier in format: <module>:<domain>:<verb>
   * @example "agency:scope:generate"
   * @example "agency:proposal:draft"
   */
  action: z
    .string()
    .min(1, 'Action is required')
    .regex(
      /^[a-z]+:[a-z]+:[a-z]+$/,
      'Action must be in format module:domain:verb (e.g., agency:scope:generate)'
    ),

  /**
   * Optional tenant ID (null for Personal mode)
   */
  tenantId: z.string().uuid().optional().nullable(),

  /**
   * Optional user ID
   */
  userId: z.string().uuid().optional().nullable(),

  /**
   * Optional module ID (e.g., "agency")
   */
  moduleId: z.string().optional().nullable(),

  /**
   * Input tokens consumed
   */
  tokensInput: z.number().int().nonnegative().optional().default(0),

  /**
   * Output tokens consumed
   */
  tokensOutput: z.number().int().nonnegative().optional().default(0),

  /**
   * Brain Units cost
   */
  units: z.number().int().nonnegative().optional().default(0),

  /**
   * Optional operation duration in milliseconds
   */
  durationMs: z.number().int().nonnegative().optional().nullable(),

  /**
   * Optional metadata (JSON object)
   */
  metadata: z.record(z.unknown()).optional(),
})

// Use input type which respects optional fields with defaults
export type RecordUsageInput = z.input<typeof RecordUsageInputSchema>

/**
 * Output schema for usage event records
 */
export const UsageEventSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  tenantId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  moduleId: z.string().nullable(),
  tokensInput: z.number(),
  tokensOutput: z.number(),
  tokensTotal: z.number().nullable(),
  units: z.number(),
  durationMs: z.number().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
})

export type UsageEvent = z.infer<typeof UsageEventSchema>

/**
 * Input schema for querying usage history
 *
 * Supports filtering by date range, action, module, and user.
 * Pagination via limit and offset.
 */
export const UsageHistoryOptionsSchema = z.object({
  /**
   * Required tenant ID (null for Personal mode)
   */
  tenantId: z.string().uuid().nullable(),

  /**
   * Filter by specific user ID
   */
  userId: z.string().uuid().optional(),

  /**
   * Filter by action pattern (e.g., "agency:scope:generate")
   */
  action: z.string().optional(),

  /**
   * Filter by module ID (e.g., "agency")
   */
  moduleId: z.string().optional(),

  /**
   * Start date (ISO 8601 string)
   */
  startDate: z.string().datetime().optional(),

  /**
   * End date (ISO 8601 string)
   */
  endDate: z.string().datetime().optional(),

  /**
   * Maximum number of records to return
   */
  limit: z.number().int().positive().max(1000).optional().default(100),

  /**
   * Number of records to skip (for pagination)
   */
  offset: z.number().int().nonnegative().optional().default(0),
})

// Use z.input to make fields with defaults optional at the input level
export type UsageHistoryOptions = z.input<typeof UsageHistoryOptionsSchema>

/**
 * Schema for aggregated usage by action
 */
export const UsageByActionSchema = z.object({
  action: z.string(),
  tokensTotal: z.number(),
  units: z.number(),
  count: z.number(),
})

export type UsageByAction = z.infer<typeof UsageByActionSchema>

/**
 * Schema for usage summary result
 */
export const UsageSummarySchema = z.object({
  /**
   * Total tokens consumed in the period
   */
  totalTokens: z.number(),

  /**
   * Total Brain Units consumed in the period
   */
  totalUnits: z.number(),

  /**
   * Total number of usage events
   */
  eventCount: z.number(),

  /**
   * Usage breakdown by action
   */
  byAction: z.array(UsageByActionSchema),
})

export type UsageSummary = z.infer<typeof UsageSummarySchema>

/**
 * Period type for usage summary aggregation
 */
export const PeriodSchema = z.enum(['day', 'week', 'month'])

export type Period = z.infer<typeof PeriodSchema>
