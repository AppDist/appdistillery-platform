/**
 * Example usage of the prompt sanitizer module
 *
 * This file demonstrates how to integrate prompt sanitization
 * into your AI operations workflow.
 */

import { validatePrompt, type PromptValidationOptions } from './prompt-sanitizer';

/**
 * Example 1: Basic validation before AI call
 */
export async function generateWithValidation(userPrompt: string) {
  // Validate and sanitize the prompt
  const validation = validatePrompt(userPrompt);

  if (!validation.valid) {
    throw new Error(`Invalid prompt: ${validation.errors.join(', ')}`);
  }

  // Log warnings if injection patterns detected
  if (validation.warnings.length > 0) {
    console.warn('[Security] Prompt warnings:', validation.warnings);
  }

  // Use sanitized prompt for AI call
  const sanitizedPrompt = validation.sanitizedPrompt!;

  // ... continue with brainHandle call using sanitizedPrompt
  return { prompt: sanitizedPrompt, warnings: validation.warnings };
}

/**
 * Example 2: Custom validation rules for long-form content
 */
export async function validateLongFormContent(content: string) {
  const options: PromptValidationOptions = {
    maxLength: 50_000, // Stricter limit for this use case
    detectInjection: true,
  };

  const validation = validatePrompt(content, options);

  return {
    valid: validation.valid,
    sanitized: validation.sanitizedPrompt,
    issues: {
      errors: validation.errors,
      warnings: validation.warnings,
    },
  };
}

/**
 * Example 3: Integration with brainHandle (conceptual)
 */
export async function safeBrainHandle(
  userPrompt: string,
  systemPrompt: string
) {
  // Step 1: Validate and sanitize user prompt
  const userValidation = validatePrompt(userPrompt);
  if (!userValidation.valid) {
    return {
      success: false as const,
      error: `Invalid user prompt: ${userValidation.errors[0]}`,
    };
  }

  // Step 2: Validate system prompt (should always be safe, but defense in depth)
  const systemValidation = validatePrompt(systemPrompt, {
    detectInjection: false, // System prompts are from code, not users
  });
  if (!systemValidation.valid) {
    return {
      success: false as const,
      error: `Invalid system prompt: ${systemValidation.errors[0]}`,
    };
  }

  // Step 3: Log any security warnings
  if (userValidation.warnings.length > 0) {
    console.warn(
      '[Security] User prompt security warnings:',
      userValidation.warnings
    );
    // Could also send to monitoring/alerting system
  }

  // Step 4: Use sanitized prompts
  return {
    success: true as const,
    sanitizedUserPrompt: userValidation.sanitizedPrompt!,
    sanitizedSystemPrompt: systemValidation.sanitizedPrompt!,
  };
}
