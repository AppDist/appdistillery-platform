import { z } from 'zod';
import { generateStructured } from './adapters/anthropic';
import { recordUsage } from '../ledger';
import { validatePrompt } from './prompt-sanitizer';
import type { BrainTask, BrainResult } from './types';

/**
 * Brain Units cost map per task type
 *
 * Fixed costs for common tasks. Tasks not in this map use token-based fallback.
 */
const UNIT_COSTS: Record<string, number> = {
  'agency.scope': 50,
  'agency.proposal': 100,
};

/**
 * Calculate Brain Units from task type and tokens
 *
 * Uses fixed cost map with token-based fallback (1 unit per 100 tokens).
 *
 * @param taskType - Task type in format 'module.task'
 * @param tokens - Total tokens consumed
 * @returns Brain Units cost
 */
function calculateUnits(taskType: string, tokens?: number): number {
  return UNIT_COSTS[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}

/**
 * Derive action string from task type
 *
 * Converts 'module.task' to 'module:task:generate' format.
 *
 * @param taskType - Task type in format 'module.task'
 * @returns Action string in format 'module:task:generate'
 * @throws {Error} If taskType format is invalid
 *
 * @example
 * ```typescript
 * deriveAction('agency.scope') // 'agency:scope:generate'
 * deriveAction('agency.proposal') // 'agency:proposal:generate'
 * ```
 */
function deriveAction(taskType: string): string {
  const parts = taskType.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid taskType format: ${taskType}. Expected 'module.task'`
    );
  }
  return `${parts[0]}:${parts[1]}:generate`;
}

/**
 * Central AI router - handles all AI operations in AppDistillery
 *
 * This is the ONLY function that should be used for AI operations. It provides:
 * - Structured output via Zod schemas
 * - Automatic usage recording via recordUsage()
 * - Provider abstraction (Anthropic default)
 * - Type safety with discriminated unions
 *
 * @param task - Brain task configuration
 * @returns Result with typed data or error
 *
 * @example Basic usage
 * ```typescript
 * const result = await brainHandle({
 *   tenantId: tenant?.id,
 *   userId: user.id,
 *   moduleId: 'agency',
 *   taskType: 'agency.scope',
 *   systemPrompt: 'You are a consultancy scope generator...',
 *   userPrompt: 'Generate scope for: ...',
 *   schema: ScopeResultSchema,
 * });
 *
 * if (!result.success) {
 *   throw new Error(result.error);
 * }
 *
 * return result.data; // Typed as ScopeResult
 * ```
 *
 * @example With options
 * ```typescript
 * const result = await brainHandle({
 *   tenantId: tenant?.id,
 *   moduleId: 'agency',
 *   taskType: 'agency.proposal',
 *   systemPrompt: systemPrompt,
 *   userPrompt: userPrompt,
 *   schema: ProposalSchema,
 *   options: {
 *     maxOutputTokens: 8000,
 *     temperature: 0.9,
 *   },
 * });
 * ```
 */
export async function brainHandle<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<BrainResult<z.infer<T>>> {
  const startTime = Date.now();

  // Validate and sanitize user prompt
  const promptValidation = validatePrompt(task.userPrompt);
  if (!promptValidation.valid) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: promptValidation.errors[0] ?? 'Invalid prompt',
      usage: { durationMs },
    };
  }

  // Log warnings for potential injection patterns (don't block)
  if (promptValidation.warnings.length > 0) {
    console.warn('[brainHandle] Prompt warnings:', promptValidation.warnings);
  }

  // Derive action from task type
  let action: string;
  try {
    action = deriveAction(task.taskType);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid task type',
      usage: { durationMs },
    };
  }

  try {
    // Call Anthropic adapter for structured generation
    const result = await generateStructured({
      schema: task.schema,
      prompt: promptValidation.sanitizedPrompt!,
      system: task.systemPrompt,
      maxOutputTokens: task.options?.maxOutputTokens,
      temperature: task.options?.temperature,
    });

    const durationMs = Date.now() - startTime;

    if (!result.success) {
      // Record failed attempt (units: 0 for analytics)
      const failedUsageResult = await recordUsage({
        action,
        tenantId: task.tenantId,
        userId: task.userId,
        moduleId: task.moduleId,
        tokensInput: 0,
        tokensOutput: 0,
        units: 0,
        durationMs,
        metadata: {
          task: task.taskType,
          failed: true,
          error: result.error,
        },
      });
      if (!failedUsageResult.success) {
        console.error('[brainHandle] Failed to record usage:', failedUsageResult.error);
      }

      return {
        success: false,
        error: result.error,
        usage: { durationMs },
      };
    }

    // Calculate Brain Units cost
    const units = calculateUnits(task.taskType, result.usage.totalTokens);

    // Record successful usage - log errors but don't lose generated data
    const usageResult = await recordUsage({
      action,
      tenantId: task.tenantId,
      userId: task.userId,
      moduleId: task.moduleId,
      tokensInput: result.usage.promptTokens,
      tokensOutput: result.usage.completionTokens,
      units,
      durationMs,
      metadata: { task: task.taskType },
    });
    if (!usageResult.success) {
      console.error('[brainHandle] Failed to record usage:', usageResult.error);
    }

    return {
      success: true,
      data: result.object,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        durationMs,
        units,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Record failure (units: 0) - log errors but don't break the flow
    const errorUsageResult = await recordUsage({
      action,
      tenantId: task.tenantId,
      userId: task.userId,
      moduleId: task.moduleId,
      tokensInput: 0,
      tokensOutput: 0,
      units: 0,
      durationMs,
      metadata: {
        task: task.taskType,
        failed: true,
        error: errorMessage,
      },
    });
    if (!errorUsageResult.success) {
      console.error('[brainHandle] Failed to record usage:', errorUsageResult.error);
    }

    return {
      success: false,
      error: errorMessage,
      usage: { durationMs },
    };
  }
}
