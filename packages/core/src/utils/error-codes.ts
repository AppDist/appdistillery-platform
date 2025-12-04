/**
 * Standardized error codes for AppDistillery Core
 *
 * Machine-readable codes for programmatic error handling.
 * Each code maps to a user-friendly message.
 */

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',

  // Tenant errors
  NO_ACTIVE_TENANT: 'NO_ACTIVE_TENANT',
  SLUG_ALREADY_TAKEN: 'SLUG_ALREADY_TAKEN',
  TENANT_CREATION_FAILED: 'TENANT_CREATION_FAILED',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  NOT_TENANT_MEMBER: 'NOT_TENANT_MEMBER',

  // Brain errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_PROMPT: 'INVALID_PROMPT',
  PROMPT_TOO_LONG: 'PROMPT_TOO_LONG',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_TIMEOUT: 'AI_TIMEOUT',
  INVALID_TASK_TYPE: 'INVALID_TASK_TYPE',

  // Ledger errors
  USAGE_RECORD_FAILED: 'USAGE_RECORD_FAILED',

  // Module errors
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  MODULE_ALREADY_INSTALLED: 'MODULE_ALREADY_INSTALLED',
  MODULE_INSTALL_FAILED: 'MODULE_INSTALL_FAILED',
  MODULE_NOT_ACTIVE: 'MODULE_NOT_ACTIVE',
  MODULE_NOT_INSTALLED: 'MODULE_NOT_INSTALLED',
  MODULE_ALREADY_DISABLED: 'MODULE_ALREADY_DISABLED',
  MODULE_UNINSTALL_FAILED: 'MODULE_UNINSTALL_FAILED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * User-friendly error messages mapped to error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  FORBIDDEN: 'You do not have permission to perform this action.',

  NO_ACTIVE_TENANT: 'No active tenant selected.',
  SLUG_ALREADY_TAKEN: 'This slug is already taken. Please choose a different one.',
  TENANT_CREATION_FAILED: 'Failed to create tenant. Please try again.',
  TENANT_NOT_FOUND: 'Tenant not found.',
  NOT_TENANT_MEMBER: 'You are not a member of this tenant.',

  RATE_LIMIT_EXCEEDED:
    "You've reached the usage limit. Please wait before trying again.",
  INVALID_PROMPT: 'Please provide valid content for your request.',
  PROMPT_TOO_LONG: 'Your request is too long. Please try with shorter content.',
  AI_GENERATION_FAILED: 'Unable to generate a response. Please try again.',
  AI_TIMEOUT: 'The request took too long. Please try again.',
  INVALID_TASK_TYPE: 'Invalid request type. Please try again.',

  USAGE_RECORD_FAILED: 'Failed to record usage.',

  MODULE_NOT_FOUND: 'Module not found.',
  MODULE_ALREADY_INSTALLED: 'Module is already installed.',
  MODULE_INSTALL_FAILED: 'Failed to install module. Please try again.',
  MODULE_NOT_ACTIVE: 'Module is not active.',
  MODULE_NOT_INSTALLED: 'Module is not installed.',
  MODULE_ALREADY_DISABLED: 'Module is already disabled.',
  MODULE_UNINSTALL_FAILED: 'Failed to uninstall module. Please try again.',

  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

/**
 * Get user-friendly message for error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? ErrorMessages.INTERNAL_ERROR;
}

/**
 * Create standardized error result
 */
export function createErrorResult(
  code: ErrorCode,
  details?: string
): {
  success: false;
  error: string;
  code: ErrorCode;
} {
  return {
    success: false,
    error: details ?? getErrorMessage(code),
    code,
  };
}
