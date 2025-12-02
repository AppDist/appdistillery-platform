import { z } from 'zod';

/**
 * Brain task configuration for AI operations
 *
 * All AI operations in AppDistillery go through brainHandle() which uses
 * this configuration to route tasks, enforce schemas, and track usage.
 */
export interface BrainTask<T extends z.ZodType = z.ZodType> {
  /** Optional tenant ID (null for personal users) */
  tenantId?: string | null;

  /** Optional user ID */
  userId?: string | null;

  /** Module ID e.g., 'agency' */
  moduleId: string;

  /**
   * Task type in format: 'module.task'
   * @example 'agency.scope'
   * @example 'agency.proposal'
   */
  taskType: string;

  /** System prompt for the AI model */
  systemPrompt: string;

  /** User prompt containing the task-specific content */
  userPrompt: string;

  /** Zod schema for structured output validation */
  schema: T;

  /** Optional generation options */
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

/**
 * Brain result using discriminated union for type-safe error handling
 *
 * @example Success case
 * ```typescript
 * const result = await brainHandle({ ... });
 * if (result.success) {
 *   console.log(result.data); // Typed as schema output
 *   console.log(result.usage.totalTokens);
 * }
 * ```
 *
 * @example Error case
 * ```typescript
 * if (!result.success) {
 *   console.error(result.error);
 *   // No data property available (TypeScript enforces this)
 * }
 * ```
 */
export type BrainResult<T> =
  | {
      success: true;
      data: T;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        durationMs: number;
        units: number;
      };
    }
  | {
      success: false;
      error: string;
      usage: {
        durationMs: number;
      };
    };
