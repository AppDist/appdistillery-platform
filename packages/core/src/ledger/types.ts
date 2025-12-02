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
