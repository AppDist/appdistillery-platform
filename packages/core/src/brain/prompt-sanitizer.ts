/**
 * Prompt Sanitizer - Validates and sanitizes user prompts before AI processing
 *
 * Provides defense-in-depth security by:
 * - Validating prompt length (prevents token exhaustion)
 * - Detecting common injection patterns (logs warnings, doesn't block)
 * - Sanitizing whitespace and control characters
 *
 * @example
 * ```typescript
 * const result = validatePrompt(userInput, { maxLength: 50000 });
 * if (!result.valid) {
 *   throw new Error(result.errors.join(', '));
 * }
 * // Use result.sanitizedPrompt for AI call
 * ```
 */

/**
 * Configuration options for prompt validation
 */
export interface PromptValidationOptions {
  /** Maximum allowed prompt length (default: 100,000 characters) */
  maxLength?: number;
  /** Enable injection pattern detection (default: true) */
  detectInjection?: boolean;
}

/**
 * Result of prompt validation
 */
export interface PromptValidationResult {
  /** Whether the prompt passes validation */
  valid: boolean;
  /** Sanitized version of the prompt (only if valid) */
  sanitizedPrompt?: string;
  /** Critical errors that prevent usage */
  errors: string[];
  /** Non-blocking warnings for logging */
  warnings: string[];
}

/**
 * Default maximum prompt length (roughly 25k tokens)
 */
const DEFAULT_MAX_LENGTH = 100_000;

/**
 * Common injection patterns to detect (case-insensitive)
 *
 * These patterns indicate potential prompt injection attempts:
 * - System prompt override attempts
 * - Role manipulation
 * - Delimiter injection for model-specific formats
 */
const INJECTION_PATTERNS = [
  // System prompt override
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(the\s+)?above/i,
  /forget\s+everything/i,
  /system\s*:\s*you\s+are/i,

  // Role manipulation (only if at start)
  /^(you\s+are|act\s+as\s+if|pretend\s+you\s+are)/i,

  // Delimiter injection (common model formats)
  /```\s*system/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
] as const;

/**
 * Validate prompt length
 *
 * @param prompt - Prompt to validate
 * @param maxLength - Maximum allowed length (default: 100,000)
 * @returns Validation result with error if too long
 *
 * @example
 * ```typescript
 * const result = validatePromptLength(prompt, 50000);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePromptLength(
  prompt: string,
  maxLength: number = DEFAULT_MAX_LENGTH
): { valid: boolean; error?: string } {
  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > maxLength) {
    return {
      valid: false,
      error: `Prompt exceeds maximum length of ${maxLength} characters (got ${prompt.length})`,
    };
  }

  return { valid: true };
}

/**
 * Detect common prompt injection patterns
 *
 * This is defense-in-depth, not foolproof. Returns warnings for logging,
 * not hard blocks. Attackers can bypass pattern matching, but this catches
 * common naive attempts.
 *
 * @param prompt - Prompt to analyze
 * @returns Detection result with matched patterns
 *
 * @example
 * ```typescript
 * const result = detectInjectionPatterns(prompt);
 * if (!result.safe) {
 *   console.warn('Potential injection detected:', result.patterns);
 * }
 * ```
 */
export function detectInjectionPatterns(prompt: string): {
  safe: boolean;
  patterns: string[];
} {
  const matchedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    safe: matchedPatterns.length === 0,
    patterns: matchedPatterns,
  };
}

/**
 * Sanitize prompt by normalizing whitespace and removing control characters
 *
 * Transformations:
 * - Trims leading/trailing whitespace
 * - Normalizes multiple spaces to single space
 * - Removes null bytes and other control characters
 * - Preserves newlines for multi-line prompts
 *
 * @param prompt - Raw prompt text
 * @returns Sanitized prompt
 *
 * @example
 * ```typescript
 * const clean = sanitizePrompt("  Hello\x00World  \n  Test  ");
 * // "Hello World\nTest"
 * ```
 */
export function sanitizePrompt(prompt: string): string {
  return (
    prompt
      // Remove null bytes and control characters (except newlines/tabs)
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize multiple spaces (but preserve newlines)
      .replace(/[^\S\n]+/g, ' ')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Remove leading/trailing empty lines
      .trim()
  );
}

/**
 * Main entry point - validates and sanitizes a prompt
 *
 * Combines all validation checks:
 * 1. Sanitizes whitespace first
 * 2. Validates length
 * 3. Detects injection patterns (warnings only)
 *
 * @param prompt - Raw prompt text
 * @param options - Validation options
 * @returns Validation result with sanitized prompt or errors
 *
 * @example
 * ```typescript
 * const result = validatePrompt(userInput, { maxLength: 50000 });
 *
 * if (!result.valid) {
 *   throw new Error(result.errors.join(', '));
 * }
 *
 * if (result.warnings.length > 0) {
 *   console.warn('Prompt warnings:', result.warnings);
 * }
 *
 * await brainHandle({
 *   userPrompt: result.sanitizedPrompt,
 *   // ...
 * });
 * ```
 */
export function validatePrompt(
  prompt: string,
  options: PromptValidationOptions = {}
): PromptValidationResult {
  const { maxLength = DEFAULT_MAX_LENGTH, detectInjection = true } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Sanitize first
  const sanitized = sanitizePrompt(prompt);

  // Step 2: Validate length
  const lengthCheck = validatePromptLength(sanitized, maxLength);
  if (!lengthCheck.valid) {
    errors.push(lengthCheck.error!);
  }

  // Step 3: Detect injection patterns (non-blocking)
  if (detectInjection) {
    const injectionCheck = detectInjectionPatterns(sanitized);
    if (!injectionCheck.safe) {
      warnings.push(
        `Potential prompt injection detected. Patterns matched: ${injectionCheck.patterns.length}`
      );
      // Log patterns for debugging (don't expose to user)
      console.warn('[PromptSanitizer] Injection patterns matched:', {
        patterns: injectionCheck.patterns,
        promptPreview: sanitized.slice(0, 100),
      });
    }
  }

  // If any errors, prompt is invalid
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
    };
  }

  // Valid - return sanitized prompt
  return {
    valid: true,
    sanitizedPrompt: sanitized,
    errors: [],
    warnings,
  };
}
