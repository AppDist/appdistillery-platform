import { z } from 'zod';
import type { BrainTask, BrainResult } from './types';
import {
  checkCache,
  checkRateLimitError,
  validateBrainTask,
  executeAndRecordUsage,
} from './brain-handle-helpers';

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
  const cachedResult = checkCache(task, startTime);
  if (cachedResult) return cachedResult;

  // Check rate limit (after cache check, before any processing)
  const rateLimitError = checkRateLimitError<z.infer<T>>(task, startTime);
  if (rateLimitError) return rateLimitError;

  // Validate task (prompt validation, task type validation)
  const validationResult = validateBrainTask<z.infer<T>>(task, startTime);
  if (!validationResult.success) return validationResult.result;

  // Execute AI generation and record usage
  return executeAndRecordUsage(
    task,
    validationResult.action,
    validationResult.sanitizedPrompt,
    startTime
  );
}
