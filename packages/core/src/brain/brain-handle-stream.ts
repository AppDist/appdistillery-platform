import { z } from 'zod';
import { streamObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { recordUsage } from '../ledger';
import { validatePrompt } from './prompt-sanitizer';
import { checkRateLimit } from './rate-limiter';
import type { BrainTask } from './types';
import { logger } from '../utils/logger';

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
 */
function calculateUnits(taskType: string, tokens?: number): number {
  return UNIT_COSTS[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}

/**
 * Derive action string from task type
 *
 * Converts 'module.task' to 'module:task:generate' format.
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
 * Stream chunk type for progressive updates
 */
export type StreamChunk<T> = {
  /** Partial object that gets more complete as stream progresses */
  partial: T;
  /** Whether the stream has completed */
  done: boolean;
};

/**
 * Result type for streaming operations
 */
export type StreamResult<T> =
  | {
      success: true;
      stream: AsyncIterable<StreamChunk<T>>;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Central AI streaming router - handles streaming AI operations in AppDistillery
 *
 * This function provides streaming capabilities for AI operations with:
 * - Partial results streamed as they generate
 * - Structured output via Zod schemas
 * - Automatic usage recording after stream completes
 * - Provider abstraction (Anthropic default)
 * - Type safety with discriminated unions
 *
 * @param task - Brain task configuration
 * @returns Result with async iterable stream or error
 *
 * @example Basic streaming usage
 * ```typescript
 * const result = await brainHandleStream({
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
 * for await (const chunk of result.stream) {
 *   console.log('Partial:', chunk.partial);
 *   if (chunk.done) {
 *     console.log('Complete!');
 *   }
 * }
 * ```
 */
export async function brainHandleStream<T extends z.ZodType>(
  task: BrainTask<T>
): Promise<StreamResult<z.infer<T>>> {
  const startTime = Date.now();

  // Check rate limit
  const rateLimitResult = checkRateLimit(task.tenantId);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`,
    };
  }

  // Validate and sanitize user prompt
  const promptValidation = validatePrompt(task.userPrompt);
  if (!promptValidation.valid) {
    return {
      success: false,
      error: promptValidation.errors[0] ?? 'Invalid prompt',
    };
  }

  // Log warnings for potential injection patterns (don't block)
  if (promptValidation.warnings.length > 0) {
    console.warn('[brainHandleStream] Prompt warnings:', promptValidation.warnings);
  }

  // Derive action from task type
  let action: string;
  try {
    action = deriveAction(task.taskType);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid task type',
    };
  }

  // Get Anthropic API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable not set',
    };
  }

  try {
    const anthropic = createAnthropic({ apiKey });

    // Start streaming with streamObject
    const modelId = 'claude-sonnet-4-5-20250929';
    // Type assertion needed for v5 overload resolution (same as generateObject)
    const result = streamObject({
      model: anthropic(modelId),
      schema: task.schema,
      prompt: promptValidation.sanitizedPrompt!,
      system: task.systemPrompt,
      maxOutputTokens: task.options?.maxOutputTokens,
      temperature: task.options?.temperature,
    } as any);

    // Create async generator that wraps the stream
    async function* wrapStream(): AsyncIterable<StreamChunk<z.infer<T>>> {
      try {
        // Stream partial objects
        for await (const partialObject of result.partialObjectStream) {
          yield {
            partial: partialObject as z.infer<T>,
            done: false,
          };
        }

        // Wait for final object and usage stats
        const finalObject = await result.object;
        const usage = await result.usage;

        // Calculate duration and units
        const durationMs = Date.now() - startTime;
        const totalTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        const units = calculateUnits(task.taskType, totalTokens);

        // Record successful usage - log errors but don't lose generated data
        const usageResult = await recordUsage({
          action,
          tenantId: task.tenantId,
          userId: task.userId,
          moduleId: task.moduleId,
          tokensInput: usage.inputTokens ?? 0,
          tokensOutput: usage.outputTokens ?? 0,
          units,
          durationMs,
          metadata: { task: task.taskType },
        });
        if (!usageResult.success) {
          logger.error('brainHandleStream', 'Failed to record usage', { error: usageResult.error });
        }

        // Yield final complete object
        yield {
          partial: finalObject,
          done: true,
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
          logger.error('brainHandleStream', 'Failed to record usage', { error: errorUsageResult.error });
        }

        throw error;
      }
    }

    return {
      success: true,
      stream: wrapStream(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
    };
  }
}
