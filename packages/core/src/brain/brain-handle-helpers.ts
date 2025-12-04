// Size-justified: Complex AI orchestration logic with streaming,
// caching, and error handling requires cohesive implementation

import { z } from 'zod';
import type { GenerateResult } from './adapters/shared';
import { sanitizeErrorMessage } from './adapters/shared';
import { generateStructured } from './adapters/anthropic';
import { generateStructuredWithOpenAI } from './adapters/openai';
import { generateStructuredWithGoogle } from './adapters/google';
import { recordUsage } from '../ledger';
import { validatePrompt } from './prompt-sanitizer';
import { checkRateLimit } from './rate-limiter';
import { generateCacheKey, getCachedResponse, setCachedResponse } from './cache';
import type { BrainTask, BrainResult } from './types';
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
export function calculateUnits(taskType: string, tokens?: number): number {
  return UNIT_COSTS[taskType] ?? Math.ceil((tokens ?? 1000) / 100);
}

/**
 * Derive action string from task type
 *
 * Converts 'module.task' to 'module:task:generate' format.
 *
 * @throws {Error} If taskType format is invalid
 */
export function deriveAction(taskType: string): string {
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
 */
export function getAdapter<T extends z.ZodType>(
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
 * Check cache and return cached result if available
 */
export function checkCache<T extends z.ZodType>(
  task: BrainTask<T>,
  startTime: number
): BrainResult<z.infer<T>> | null {
  const useCache = task.options?.useCache !== false;
  if (!useCache) return null;

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
        durationMs: Date.now() - startTime,
      },
    };
  }

  return null;
}

/**
 * Check rate limit and return error result if exceeded
 */
export function checkRateLimitError<T>(
  task: BrainTask<z.ZodType>,
  startTime: number
): BrainResult<T> | null {
  const rateLimitResult = checkRateLimit(task.tenantId);
  if (!rateLimitResult.allowed) {
    const durationMs = Date.now() - startTime;
    console.warn('[brainHandle] Rate limit exceeded:', {
      tenantId: task.tenantId,
      retryAfter: rateLimitResult.retryAfter,
    });

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

  return null;
}

/**
 * Validation result with action string
 */
interface ValidationResult<T> {
  success: true;
  action: string;
  sanitizedPrompt: string;
}

interface ValidationError<T> {
  success: false;
  result: BrainResult<T>;
}

/**
 * Validate task (prompt and taskType format)
 */
export function validateBrainTask<T>(
  task: BrainTask<z.ZodType>,
  startTime: number
): ValidationResult<T> | ValidationError<T> {
  // Validate and sanitize user prompt
  const promptValidation = validatePrompt(task.userPrompt);
  if (!promptValidation.valid) {
    const durationMs = Date.now() - startTime;
    console.warn('[brainHandle] Prompt validation failed:', promptValidation.errors);

    const technicalError = promptValidation.errors[0] ?? 'Invalid prompt';
    let userFriendlyError = 'Unable to process your request. Please try again.';

    if (technicalError.toLowerCase().includes('empty')) {
      userFriendlyError = 'Please provide some content for your request.';
    } else if (technicalError.toLowerCase().includes('exceeds maximum length')) {
      userFriendlyError = 'Your request is too long. Please try with a shorter prompt.';
    }

    return {
      success: false,
      result: {
        success: false,
        error: userFriendlyError,
        usage: { durationMs },
      },
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
    const technicalError = error instanceof Error ? error.message : 'Invalid task type';
    logger.error('brainHandle', 'Invalid task type', { error: technicalError });

    return {
      success: false,
      result: {
        success: false,
        error: 'Unable to process your request. Please try again later.',
        usage: { durationMs },
      },
    };
  }

  return {
    success: true,
    action,
    sanitizedPrompt: promptValidation.sanitizedPrompt!,
  };
}

/**
 * Execute AI generation and record usage
 */
export async function executeAndRecordUsage<T extends z.ZodType>(
  task: BrainTask<T>,
  action: string,
  sanitizedPrompt: string,
  startTime: number
): Promise<BrainResult<z.infer<T>>> {
  try {
    // Get adapter and execute AI generation
    const provider = task.options?.provider ?? 'anthropic';
    const adapter = getAdapter(provider);

    const result = await adapter({
      schema: task.schema,
      prompt: sanitizedPrompt,
      system: task.systemPrompt,
      maxOutputTokens: task.options?.maxOutputTokens,
      temperature: task.options?.temperature,
      timeoutMs: task.options?.timeoutMs,
    });

    const durationMs = Date.now() - startTime;

    // Handle adapter failure
    if (!result.success) {
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
        logger.error('brainHandle', 'Failed to record usage', { error: failedUsageResult.error });
      }

      return {
        success: false,
        error: result.error,
        usage: { durationMs },
      };
    }

    // Calculate Brain Units cost
    const units = calculateUnits(task.taskType, result.usage.totalTokens);

    // Record successful usage
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
      logger.error('brainHandle', 'Failed to record usage', { error: usageResult.error });
    }

    // Cache the successful result
    const useCache = task.options?.useCache !== false;
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
    const technicalError = error instanceof Error ? error.message : 'Unknown error';

    // Sanitize error message for user consumption
    const userFriendlyError = error instanceof Error
      ? sanitizeErrorMessage(error, 'brainHandle')
      : 'Unable to complete your request. Please try again later.';

    // Record failure
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
      logger.error('brainHandle', 'Failed to record usage', { error: errorUsageResult.error });
    }

    return {
      success: false,
      error: userFriendlyError,
      usage: { durationMs },
    };
  }
}
