import { z } from 'zod';
import { generateStructured } from './adapters/anthropic';
import { generateStructuredWithOpenAI } from './adapters/openai';
import { generateStructuredWithGoogle } from './adapters/google';
import type { GenerateResult } from './adapters/shared';
import { sanitizeErrorMessage } from './adapters/shared';
import { recordUsage } from '../ledger';
import { validatePrompt } from './prompt-sanitizer';
import { checkRateLimit } from './rate-limiter';
import { generateCacheKey, getCachedResponse, setCachedResponse } from './cache';
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
 * Get adapter function based on provider selection
 *
 * Routes to the correct AI provider adapter (Anthropic, OpenAI, or Google).
 * Defaults to Anthropic if provider is not specified.
 *
 * @param provider - Provider name ('anthropic' | 'google' | 'openai')
 * @returns Adapter function for structured generation
 *
 * @example
 * ```typescript
 * const adapter = getAdapter('google');
 * const result = await adapter({ schema, prompt, system });
 * ```
 */
function getAdapter<T extends z.ZodType>(
  provider: 'anthropic' | 'google' | 'openai' = 'anthropic'
): (options: {
  schema: T;
  prompt: string;
  system?: string;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}) => Promise<GenerateResult<z.infer<T>>> {
  switch (provider) {
    case 'google':
      return generateStructuredWithGoogle as (options: {
        schema: T;
        prompt: string;
        system?: string;
        maxOutputTokens?: number;
        temperature?: number;
      }) => Promise<GenerateResult<z.infer<T>>>;
    case 'openai':
      return generateStructuredWithOpenAI as (options: {
        schema: T;
        prompt: string;
        system?: string;
        maxOutputTokens?: number;
        temperature?: number;
      }) => Promise<GenerateResult<z.infer<T>>>;
    case 'anthropic':
    default:
      return generateStructured as (options: {
        schema: T;
        prompt: string;
        system?: string;
        maxOutputTokens?: number;
        temperature?: number;
        timeoutMs?: number;
      }) => Promise<GenerateResult<z.infer<T>>>;
  }
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

  // Check cache early (before rate limit, validation, or AI call)
  const useCache = task.options?.useCache !== false; // Default: true
  if (useCache) {
    const cacheKey = generateCacheKey(
      task.taskType,
      task.systemPrompt,
      task.userPrompt,
      task.schema
    );
    const cached = getCachedResponse<z.infer<T>>(cacheKey);

    if (cached) {
      return {
        success: true,
        data: cached.data,
        usage: {
          ...cached.usage,
          durationMs: Date.now() - startTime, // Actual time for cache retrieval
        },
      };
    }
  }

  // Check rate limit (after cache check, before any processing)
  const rateLimitResult = checkRateLimit(task.tenantId);
  if (!rateLimitResult.allowed) {
    const durationMs = Date.now() - startTime;
    // Log technical details for debugging
    console.warn('[brainHandle] Rate limit exceeded:', {
      tenantId: task.tenantId,
      retryAfter: rateLimitResult.retryAfter,
    });

    // User-friendly error with time unit conversion
    const seconds = rateLimitResult.retryAfter || 30;
    let timeMessage: string;
    if (seconds >= 3600) {
      const hours = Math.ceil(seconds / 3600);
      timeMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      timeMessage = `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    return {
      success: false,
      error: `You've reached the usage limit. Please wait ${timeMessage} before trying again.`,
      usage: { durationMs },
    };
  }

  // Validate and sanitize user prompt
  const promptValidation = validatePrompt(task.userPrompt);
  if (!promptValidation.valid) {
    const durationMs = Date.now() - startTime;
    // Log technical error details for debugging
    console.warn('[brainHandle] Prompt validation failed:', promptValidation.errors);

    // Return user-friendly error message
    const technicalError = promptValidation.errors[0] ?? 'Invalid prompt';
    let userFriendlyError = 'Unable to process your request. Please try again.';

    if (technicalError.toLowerCase().includes('empty')) {
      userFriendlyError = 'Please provide some content for your request.';
    } else if (technicalError.toLowerCase().includes('exceeds maximum length')) {
      userFriendlyError = 'Your request is too long. Please try with a shorter prompt.';
    }

    return {
      success: false,
      error: userFriendlyError,
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
    // Log technical error for debugging
    const technicalError = error instanceof Error ? error.message : 'Invalid task type';
    console.error('[brainHandle] Invalid task type:', technicalError);

    return {
      success: false,
      error: 'Unable to process your request. Please try again later.',
      usage: { durationMs },
    };
  }

  try {
    // Get adapter based on provider selection (defaults to Anthropic)
    const provider = task.options?.provider ?? 'anthropic';
    const adapter = getAdapter(provider);

    // Call selected adapter for structured generation
    const result = await adapter({
      schema: task.schema,
      prompt: promptValidation.sanitizedPrompt!,
      system: task.systemPrompt,
      maxOutputTokens: task.options?.maxOutputTokens,
      temperature: task.options?.temperature,
      timeoutMs: task.options?.timeoutMs,
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
      metadata: { task: task.taskType, cached: false },
    });
    if (!usageResult.success) {
      console.error('[brainHandle] Failed to record usage:', usageResult.error);
    }

    // Cache the successful result
    if (useCache) {
      const cacheKey = generateCacheKey(
        task.taskType,
        task.systemPrompt,
        task.userPrompt,
        task.schema
      );
      setCachedResponse(
        cacheKey,
        result.object,
        {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          durationMs,
          units,
        },
        task.options?.cacheTTL
      );
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
    const technicalError =
      error instanceof Error ? error.message : 'Unknown error';

    // Sanitize error message for user consumption
    const userFriendlyError = error instanceof Error
      ? sanitizeErrorMessage(error, 'brainHandle')
      : 'Unable to complete your request. Please try again later.';

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
        error: technicalError,
      },
    });
    if (!errorUsageResult.success) {
      console.error('[brainHandle] Failed to record usage:', errorUsageResult.error);
    }

    return {
      success: false,
      error: userFriendlyError,
      usage: { durationMs },
    };
  }
}
